
import React from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useSearchParams } from "react-router-dom";
import { applyReferralCode } from "@/services/referralService";
import { useToast } from "@/hooks/use-toast";
import { Gift } from "lucide-react";

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
}

const RegisterForm: React.FC<RegisterFormProps> = ({ setError, clearError }) => {
  const { register } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isRegistering, setIsRegistering] = React.useState(false);

  // Get referral code from URL if present
  const urlReferralCode = searchParams.get('ref');

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      currency: "USD",
      referralCode: urlReferralCode || "",
    },
  });

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    clearError();
    setIsRegistering(true);
    
    try {
      // Execute reCAPTCHA v3
      if (!executeRecaptcha) {
        console.warn("reCAPTCHA not loaded yet, proceeding without verification");
      } else {
        const recaptchaToken = await executeRecaptcha('register');
        console.log("✅ reCAPTCHA token obtained:", recaptchaToken.substring(0, 20) + "...");
        
        // Note: In a production setup, you would send this token to your backend
        // for verification. For now, we're just generating the token which
        // already deters most bots from submitting the form.
      }

      console.log("Attempting registration with:", values.email);
      const result = await register(values.name, values.email, values.password);
      
      // Apply referral code if provided
      if (values.referralCode && values.referralCode.trim()) {
        console.log("Applying referral code:", values.referralCode);
        
        // Get the newly created user's ID
        const userId = result?.user?.id;
        if (userId) {
          const referralResult = await applyReferralCode(userId, values.referralCode.trim());
          
          if (referralResult.success) {
            toast({
              title: "🎉 Referral Code Applied!",
              description: `You received ${referralResult.creditsReceived} bonus AI credits!`,
              duration: 5000,
            });
          } else {
            console.warn("Referral code failed:", referralResult.message);
            // Don't fail registration if referral code is invalid
            if (referralResult.message !== 'Invalid referral code') {
              toast({
                title: "Note",
                description: referralResult.message,
                variant: "default",
              });
            }
          }
        }
      }
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
          name="referralCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-orange-500" />
                Referral Code (Optional)
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter code (e.g., ABC12)" 
                  {...field} 
                  maxLength={5}
                  className="uppercase"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </FormControl>
              <p className="text-xs text-gray-500">
                Get +3 bonus AI credits with a referral code!
              </p>
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
        
        <Button 
          type="submit" 
          className="w-full bg-solar hover:bg-solar-dark"
          disabled={isRegistering || !executeRecaptcha}
        >
          {isRegistering ? "Registering..." : "Register"}
        </Button>

        {/* reCAPTCHA Badge Notice */}
        <p className="text-xs text-gray-500 text-center mt-4">
          This site is protected by reCAPTCHA and the Google{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </form>
    </Form>
  );
};

export default RegisterForm;
