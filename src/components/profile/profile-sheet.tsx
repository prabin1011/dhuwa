'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import type { WithId } from "@/firebase";
import { useForm, Controller } from 'react-hook-form';
import { STEPS, type OnboardingData } from '@/lib/onboarding-questions';
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { deleteUserAccount } from "@/app/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserProfile extends Partial<OnboardingData> {
    username?: string;
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
    const { control, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<OnboardingData>({
        defaultValues: {
            ...userProfile
        },
    });

    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDeleteAccount = async () => {
        if (!user) {
             toast({ variant: "destructive", title: "Not logged in", description: "You must be logged in to delete an account." });
             return;
        }
        setIsDeleting(true);
        const result = await deleteUserAccount(user.uid);
        setIsDeleting(false);

        if (result.success) {
            toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
            onOpenChange(false);
            auth?.signOut();
            router.push('/login');
        } else {
            toast({ variant: "destructive", title: "Deletion Failed", description: result.message });
        }
    }
    
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
            <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 py-4">
                {Object.entries(groupedSteps).map(([title, steps]) => (
                    <div key={title} className="space-y-4">
                        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
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
                                                <RadioGroup {...field} className="grid grid-cols-2 gap-2">
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
                                        return <Input {...field} />;
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </form>
        </ScrollArea>
        <SheetFooter className="mt-auto pt-4 border-t flex-col sm:flex-row sm:justify-between">
             {!isAnonymous ? (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>Delete Account</Button>
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
             ) : <div />}
            <Button type="submit" form="profile-form" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
