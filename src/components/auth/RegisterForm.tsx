
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { validateEmail } from "@/services/emailValidationService";
import { isRateLimited, recordSignupAttempt, isEmailRateLimited, recordEmailAttempt } from "@/services/rateLimitService";
import { executeRecaptcha, initializeRecaptcha } from "@/services/recaptchaService";
import { Gift, AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  currency: z.string().default("USD"),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const currencyOptions = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "INR", label: "Indian Rupee (INR)" },
  { value: "CNY", label: "Chinese Yuan (CNY)" },
];

interface RegisterFormProps {
  setError: (error: string | null) => void;
  clearError: () => void;
  initialReferralCode?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ setError, clearError, initialReferralCode = "" }) => {
  const { register } = useAuth();
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [recaptchaReady, setRecaptchaReady] = React.useState(false);
  const [hasReferralBonus, setHasReferralBonus] = React.useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      currency: "USD",
      referralCode: initialReferralCode.toUpperCase(),
    },
  });

  // Initialize reCAPTCHA
  useEffect(() => {
    initializeRecaptcha().then((success) => {
      setRecaptchaReady(success);
      if (!success) {
        console.warn('reCAPTCHA not available, proceeding without it');
      }
    });
  }, []);

  // Check if referral code is entered
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'referralCode') {
        setHasReferralBonus(!!value.referralCode && value.referralCode.length === 5);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    clearError();
    setIsRegistering(true);
    
    try {
      // 1. Check rate limits
      const rateLimit = isRateLimited();
      if (rateLimit.limited) {
        setError(rateLimit.message || "Too many sign-up attempts. Please try again later.");
        setIsRegistering(false);
        return;
      }

      const emailLimit = isEmailRateLimited(values.email);
      if (emailLimit.limited) {
        setError(emailLimit.message || "This email was recently used. Please try again later.");
        setIsRegistering(false);
        return;
      }

      // 2. Validate email
      const emailValidation = await validateEmail(values.email);
      if (!emailValidation.isValid) {
        setError(emailValidation.reason || "Invalid email address");
        setIsRegistering(false);
        return;
      }

      // 3. Execute reCAPTCHA
      let recaptchaToken = '';
      if (recaptchaReady) {
        try {
          recaptchaToken = await executeRecaptcha('signup');
          console.log('reCAPTCHA token obtained');
        } catch (error) {
          console.error('reCAPTCHA error:', error);
          // Continue without reCAPTCHA if it fails
        }
      }

      // 4. Record signup attempt
      recordSignupAttempt();
      recordEmailAttempt(values.email);

      // 5. Attempt registration with referral code
      console.log("Attempting registration with:", values.email);
      await register(
        values.name, 
        values.email, 
        values.password, 
        values.referralCode, 
        recaptchaToken
      );

      // Success! The register function will handle profile creation and referral processing
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
        {/* Security Badge */}
        {recaptchaReady && (
          <Alert className="bg-green-50 border-green-200">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs text-green-700">
              Protected by reCAPTCHA
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Currency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencyOptions.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Referral Code Input */}
        <FormField
          control={form.control}
          name="referralCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-[#FFA500]" />
                Referral Code (Optional)
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="ABC12" 
                  {...field} 
                  maxLength={5}
                  className="uppercase"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {hasReferralBonus ? (
                  <span className="text-green-600 font-medium">
                    🎉 You'll get +3 AI credits bonus!
                  </span>
                ) : (
                  <span className="text-gray-500">
                    Have a referral code? Get +3 AI credits
                  </span>
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-solar hover:bg-solar-dark"
          disabled={isRegistering}
        >
          {isRegistering ? "Registering..." : "Register"}
        </Button>

        {/* reCAPTCHA Notice */}
        {recaptchaReady && (
          <p className="text-xs text-gray-500 text-center">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#FFA500] hover:underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-[#FFA500] hover:underline">
              Terms of Service
            </a>{' '}
            apply.
          </p>
        )}
      </form>
    </Form>
  );
};

export default RegisterForm;
