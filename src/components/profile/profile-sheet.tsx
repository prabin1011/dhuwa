
'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import type { WithId } from "@/firebase";
import { useForm, Controller } from 'react-hook-form';
import { STEPS as PROFILE_STEPS, type OnboardingData } from '@/lib/onboarding-questions';
import { useFirebase } from "@/firebase";
import { doc, updateDoc, writeBatch, collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { useRouter, usePathname, useParams } from 'next/navigation';
import { deleteUser } from "firebase/auth";
import { useNotifications } from '@/hooks/use-notifications';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Locale } from '@/i18n';
import { MyCommunityPosts } from '../community/my-community-posts';

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CNY", "CHF", "NZD", "BRL", "HKD", "SGD", "SEK", "KRW", "NOK", "MXN", "RUB", "ZAR", "TRY", "NPR"];


interface UserProfile extends Partial<OnboardingData> {
    username?: string;
    fcmTokens?: string[];
    currency?: string;
    shareToCommunity?: 'yes' | 'no';
}

interface ProfileSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userProfile: WithId<UserProfile>;
}

export function ProfileSheet({ isOpen, onOpenChange, userProfile }: ProfileSheetProps) {
    const { firestore, user } = useFirebase();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const locale = params.locale as Locale;
    const { toast } = useToast();
    const { requestPermissionAndToken, permissionStatus: initialPermissionStatus } = useNotifications();
    const [permissionStatus, setPermissionStatus] = useState(initialPermissionStatus);
    
    useEffect(() => {
        setPermissionStatus(initialPermissionStatus);
    }, [initialPermissionStatus]);

    const { control, handleSubmit, reset, getValues, setValue, formState: { isSubmitting, isDirty } } = useForm<OnboardingData>({
        defaultValues: {
            ...userProfile,
            habitDetails: userProfile.habitDetails || {},
            currency: userProfile.currency || 'USD',
            language: userProfile.language || 'en',
            shareToCommunity: userProfile.shareToCommunity || 'no',
        },
    });

    useEffect(() => {
        // Reset the form with the latest userProfile when the sheet is opened
        if (isOpen) {
            reset({
                ...userProfile,
                habitDetails: userProfile.habitDetails || {},
                currency: userProfile.currency || 'USD',
                language: userProfile.language || 'en',
                shareToCommunity: userProfile.shareToCommunity || 'no',
            });
        }
    }, [isOpen, userProfile, reset]);

    const [isDeleting, setIsDeleting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const onSubmit = async (data: OnboardingData) => {
        if (!user) return;
        const profileRef = doc(firestore, 'users', user.uid);
        try {
            const finalHabitDetails: OnboardingData['habitDetails'] = {};
            for (const habit in data.habitDetails) {
                finalHabitDetails[habit] = {
                    packCost: String(data.habitDetails[habit].packCost) || '0',
                    itemsPerPack: String(data.habitDetails[habit].itemsPerPack) || '0',
                    itemsPerDay: data.habitDetails[habit].itemsPerDay
                }
            }

            const dataToSave = {
                ...data,
                habitDetails: finalHabitDetails,
            };
            await updateDoc(profileRef, dataToSave as any);
            toast({
                title: "Profile Updated",
                description: "Your changes have been saved successfully.",
            });
            onOpenChange(false);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not save your profile.",
            });
        }
    };
    
    const handleNotificationToggle = async (enabled: boolean) => {
        setValue('reminders', enabled ? 'yes' : 'no', { shouldDirty: true });
        
        if (enabled) {
            await requestPermissionAndToken();
            setPermissionStatus(Notification.permission); // Re-check permission status after request
        }
    }

    const handleLanguageChange = (newLocale: Locale) => {
        setValue('language', newLocale, { shouldDirty: true });
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
        // We replace the current route with one for the new locale.
        // The pathname is locale-agnostic, so we need to construct the new path.
        const newPath = pathname.startsWith(`/${locale}`) ? pathname.substring(`/${locale}`.length) : pathname;
        router.replace(`/${newLocale}${newPath}`);
    }
    
    const isPermissionDenied = permissionStatus === 'denied';

    const handleDeleteAccount = async () => {
        if (!user) {
             toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to delete an account." });
             return;
        }
        setIsDeleting(true);

        const batch = writeBatch(firestore);
        const urgesRef = collection(firestore, `users/${user.uid}/urges`);
        const userProfileRef = doc(firestore, `users/${user.uid}`);
        const notificationsRef = collection(firestore, `users/${user.uid}/notifications`);

        try {
            // Delete subcollections first
            const urgesSnapshot = await getDocs(urgesRef);
            urgesSnapshot.forEach(doc => batch.delete(doc.ref));

            const notificationsSnapshot = await getDocs(notificationsRef);
            notificationsSnapshot.forEach(doc => batch.delete(doc.ref));

            // Delete main profile doc
            batch.delete(userProfileRef);
            
            await batch.commit();
            await deleteUser(user);
            
            toast({ title: "Account Deleted", description: "Your account and all data have been permanently deleted." });
            router.push(`/${locale}/login`);
            onOpenChange(false);

        } catch (error: any) {
            console.error("Error deleting account:", error);
            setIsDeleting(false);
            toast({ variant: "destructive", title: "Deletion Failed", description: error.message || "Could not delete account. You may need to log in again." });
        }
    }

    const handleResetData = async () => {
        if (!user) return;
        setIsResetting(true);
        const urgesRef = collection(firestore, `users/${user.uid}/urges`);
        const notificationsRef = collection(firestore, `users/${user.uid}/notifications`);
        const batch = writeBatch(firestore);
        try {
            const urgesSnapshot = await getDocs(urgesRef);
            const notificationsSnapshot = await getDocs(notificationsRef);

            if (urgesSnapshot.empty && notificationsSnapshot.empty) {
                toast({ title: "No Data", description: "There is no activity data to reset." });
                setIsResetting(false);
                return;
            }
            urgesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            notificationsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            toast({ title: "Data Reset", description: "Your activity log has been cleared." });
            onOpenChange(false); // Close sheet on success
        } catch (error: any) {
             toast({ variant: "destructive", title: "Reset Failed", description: error.message });
        } finally {
            setIsResetting(false);
        }
    };
    
    const groupedSteps = PROFILE_STEPS.reduce((acc, step) => {
        if (step.type === 'summary' || step.field === 'reminders' || step.field === 'language' || step.field === 'currency') return acc;
        
        if (step.type === 'dynamic') {
             (getValues('habits') || []).forEach(habit => {
                const habitTitle = `${habit} Details`;
                if (!acc[habitTitle]) {
                    acc[habitTitle] = [];
                }
                 acc[habitTitle].push(
                    { id: -1, title: habitTitle, field: `habitDetails.${habit}.packCost`, question: `Cost per pack of ${habit}`, type: 'number'},
                    { id: -2, title: habitTitle, field: `habitDetails.${habit}.itemsPerPack`, question: `Items per pack of ${habit}`, type: 'number'},
                    { id: -3, title: habitTitle, field: `habitDetails.${habit}.itemsPerDay`, question: `Average ${habit} per day`, type: 'radio', options: [ {value: '1-5', label: '1-5'}, {value: '6-10', label: '6-10'}, {value: '11-15', label: '11-15'}, {value: '16-20', label: '16-20'}, {value: '20+', label: 'More than 20'}, ]}
                );
             });

        } else {
             if (!acc[step.title]) {
                acc[step.title] = [];
            }
            acc[step.title].push(step);
        }

        return acc;
    }, {} as Record<string, typeof PROFILE_STEPS>);


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Profile</SheetTitle>
          <SheetDescription>
            View and edit your onboarding answers. Your progress is tied to this information.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
            <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">App Settings</h3>
                     <div className="space-y-2">
                        <Label>Language</Label>
                        <Controller
                            name="language"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={(v) => handleLanguageChange(v as Locale)} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="nb">Norsk</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>

                {Object.entries(groupedSteps).map(([title, steps]) => (
                    <div key={title} className="space-y-4">
                        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                        
                            {steps.map(step => (
                                <div key={String(step.field)} className="space-y-2">
                                    <Label>{step.question}</Label>
                                    <Controller
                                        name={step.field as any}
                                        control={control}
                                        render={({ field: controllerField }) => {
                                            if (step.type === 'number') {
                                                return <Input type="number" {...controllerField} value={String(controllerField.value || '')} onChange={e => controllerField.onChange(e.target.value)} />;
                                            }
                                            if (step.type === 'radio' && step.options) {
                                                return (
                                                    <RadioGroup {...controllerField} onValueChange={controllerField.onChange} className="grid grid-cols-2 gap-2">
                                                        {step.options.map(option => (
                                                            <Label key={option.value} htmlFor={`${String(step.field)}-${option.value}`} className="flex items-center space-x-2 rounded-md border border-secondary bg-secondary/50 p-2 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                                                <RadioGroupItem value={option.value} id={`${String(step.field)}-${option.value}`} />
                                                                <p className="font-medium text-xs">{option.label}</p>
                                                            </Label>
                                                        ))}
                                                    </RadioGroup>
                                                );
                                            }
                                            if (step.type === 'checkbox' && step.options) {
                                                return (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {step.options.map(option => (
                                                            <Label key={option.value} htmlFor={`${String(step.field)}-${option.value}`} className="flex items-center space-x-2 rounded-md border border-secondary bg-secondary/50 p-2 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                                                <Checkbox
                                                                    id={`${String(step.field)}-${option.value}`}
                                                                    checked={(controllerField.value as string[] || []).includes(option.value)}
                                                                    onCheckedChange={(checked) => {
                                                                        const currentValues = controllerField.value as string[] || [];
                                                                        const newValues = checked
                                                                            ? [...currentValues, option.value]
                                                                            : currentValues.filter(v => v !== option.value);
                                                                        controllerField.onChange(newValues);
                                                                    }}
                                                                />
                                                                <p className="font-medium text-xs">{option.label}</p>
                                                            </Label>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return <Input {...controllerField} value={controllerField.value || ''} />;
                                        }}
                                    />
                                </div>
                            ))}
                        
                    </div>
                ))}
                
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Financials</h3>
                     <div className="space-y-2">
                        <Label>Currency</Label>
                        <Controller
                            name="currency"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a currency" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        {CURRENCIES.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                </div>

                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Community & Notifications</h3>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Share Wins to Community</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically post your replacement activities to the community feed.
                            </p>
                        </div>
                         <Controller
                            name="shareToCommunity"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    checked={field.value === 'yes'}
                                    onCheckedChange={(checked) => field.onChange(checked ? 'yes' : 'no')}
                                />
                            )}
                         />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Enable Reminders</Label>
                            <p className="text-sm text-muted-foreground">
                                {isPermissionDenied 
                                    ? "Permission was denied. You must enable it in your browser settings."
                                    : "Receive motivational reminders and alerts."
                                }
                            </p>
                        </div>
                         <Controller
                            name="reminders"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    checked={field.value === 'yes'}
                                    onCheckedChange={handleNotificationToggle}
                                    disabled={isPermissionDenied}
                                />
                            )}
                         />
                    </div>
                </div>
                <MyCommunityPosts />
            </form>
        </ScrollArea>
        <SheetFooter className="mt-auto pt-4 border-t flex-col sm:flex-col sm:items-stretch gap-2">
            <Button type="submit" form="profile-form" disabled={isSubmitting || !isDirty} className="w-full">
                {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <Separator />
            <div className="flex justify-between gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="flex-1" disabled={isResetting}>Reset Data</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Reset Your Activity Data?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete all your logged urges, moods, and progress. Your profile settings will be kept. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetData} disabled={isResetting}>
                                {isResetting ? 'Resetting...' : 'Yes, Reset Data'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex-1" disabled={isDeleting}>Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Continue'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
