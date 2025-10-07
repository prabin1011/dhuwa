
'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import type { WithId } from "@/firebase";
import { useForm, Controller } from 'react-hook-form';
import { STEPS, type OnboardingData } from '@/lib/onboarding-questions';
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
import { useRouter } from "next/navigation";
import { deleteUser } from "firebase/auth";
import { useNotifications } from '@/hooks/use-notifications';
import { Bell, BellOff, Copy } from 'lucide-react';
import { Separator } from '../ui/separator';

interface UserProfile extends Partial<OnboardingData> {
    username?: string;
    fcmTokens?: string[];
}

interface ProfileSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userProfile: WithId<UserProfile>;
}

export function ProfileSheet({ isOpen, onOpenChange, userProfile }: ProfileSheetProps) {
    const { firestore, user, auth } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const { requestPermissionAndToken, fcmToken } = useNotifications();
    const [isSubmittingNotifications, setIsSubmittingNotifications] = useState(false);

    const { control, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<OnboardingData>({
        defaultValues: {
            ...userProfile
        },
    });

    const [isDeleting, setIsDeleting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const isAnonymous = user?.isAnonymous;

    const onSubmit = async (data: OnboardingData) => {
        if (!user) return;
        const profileRef = doc(firestore, 'users', user.uid, 'profile', 'main');
        try {
            const dataToSave = {
                ...data,
                packCost: parseFloat(String(data.packCost)) || 0,
                itemsPerPack: parseInt(String(data.itemsPerPack), 10) || 0,
                singleCost: parseFloat(String(data.singleCost)) || 0,
            };
            await updateDoc(profileRef, dataToSave);
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
    
    const handleNotificationRequest = async () => {
        setIsSubmittingNotifications(true);
        await requestPermissionAndToken();
        setIsSubmittingNotifications(false);
    }

    const handleCopyToken = () => {
        if (fcmToken) {
            navigator.clipboard.writeText(fcmToken);
            toast({ title: 'Token Copied!', description: 'FCM token has been copied to your clipboard.' });
        }
    }
    
    const hasNotificationToken = userProfile.fcmTokens && userProfile.fcmTokens.length > 0;


    const handleDeleteAccount = async () => {
        if (!user) {
             toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to delete an account." });
             return;
        }
        setIsDeleting(true);

        const batch = writeBatch(firestore);
        const urgesRef = collection(firestore, `users/${user.uid}/urges`);
        const userProfileRef = doc(firestore, `users/${user.uid}/profile/main`);
        const userDocRef = doc(firestore, `users/${user.uid}`);

        try {
            // Delete subcollections first
            const urgesSnapshot = await getDocs(urgesRef);
            urgesSnapshot.forEach(doc => batch.delete(doc.ref));

            // Delete main profile docs
            batch.delete(userProfileRef);
            batch.delete(userDocRef);
            
            await batch.commit();
            await deleteUser(user);
            
            toast({ title: "Account Deleted", description: "Your account and all data have been permanently deleted." });
            onOpenChange(false);
            router.push('/login');

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
        const batch = writeBatch(firestore);
        try {
            const urgesSnapshot = await getDocs(urgesRef);
            if (urgesSnapshot.empty) {
                toast({ title: "No Data", description: "There is no activity data to reset." });
                setIsResetting(false);
                return;
            }
            urgesSnapshot.forEach(doc => {
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
    
    // Group steps by title
    const groupedSteps = STEPS.reduce((acc, step) => {
        if (step.type === 'summary') return acc;
        if (!acc[step.title]) {
            acc[step.title] = [];
        }
        acc[step.title].push(step);
        return acc;
    }, {} as Record<string, typeof STEPS>);


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
            <div className="space-y-6 py-4">
                {Object.entries(groupedSteps).map(([title, steps]) => (
                    <div key={title} className="space-y-4">
                        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                        <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {steps.map(step => (
                                <div key={step.field} className="space-y-2">
                                    <Label>{step.question}</Label>
                                    <Controller
                                        name={step.field}
                                        control={control}
                                        render={({ field }) => {
                                            if (step.type === 'number') {
                                                return <Input type="number" {...field} value={field.value || ''} />;
                                            }
                                            if (step.type === 'radio' && step.options) {
                                                return (
                                                    <RadioGroup {...field} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                                                        {step.options.map(option => (
                                                            <Label key={option.value} htmlFor={`${step.field}-${option.value}`} className="flex items-center space-x-2 rounded-md border border-secondary bg-secondary/50 p-2 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                                                <RadioGroupItem value={option.value} id={`${step.field}-${option.value}`} />
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
                                                            <Label key={option.value} htmlFor={`${step.field}-${option.value}`} className="flex items-center space-x-2 rounded-md border border-secondary bg-secondary/50 p-2 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                                                <Checkbox
                                                                    id={`${step.field}-${option.value}`}
                                                                    checked={(field.value as string[] || []).includes(option.value)}
                                                                    onCheckedChange={(checked) => {
                                                                        const currentValues = field.value as string[] || [];
                                                                        const newValues = checked
                                                                            ? [...currentValues, option.value]
                                                                            : currentValues.filter(v => v !== option.value);
                                                                        field.onChange(newValues);
                                                                    }}
                                                                />
                                                                <p className="font-medium text-xs">{option.label}</p>
                                                            </Label>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return <Input {...field} value={field.value || ''} />;
                                        }}
                                    />
                                </div>
                            ))}
                        </form>
                    </div>
                ))}
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold tracking-tight">Notifications</h3>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive motivational reminders and alerts.
                            </p>
                        </div>
                         <Button variant="outline" size="icon" onClick={handleNotificationRequest} disabled={isSubmittingNotifications || hasNotificationToken}>
                            {hasNotificationToken ? <BellOff className="h-5 w-5"/> : <Bell className="h-5 w-5" />}
                        </Button>
                    </div>
                     {fcmToken && (
                        <div className="flex items-center gap-2">
                            <Input value={fcmToken} readOnly className="text-xs" />
                            <Button variant="outline" size="icon" onClick={handleCopyToken}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

            </div>
        </ScrollArea>
        <SheetFooter className="mt-auto pt-4 border-t flex-col sm:flex-col sm:items-stretch gap-2">
            <Button type="submit" form="profile-form" disabled={isSubmitting || !isDirty} className="w-full">
                {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <Separator />
            <div className="flex justify-between gap-2">
                 {!isAnonymous ? (
                    <>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="flex-1" disabled={isResetting}>Reset Data</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Your Activity Data?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete all your logged smokes, moods, and progress. Your profile settings will be kept. This action cannot be undone.
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
                    </>
                 ) : <div />}
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
