"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InputGroup from "@/components/FormElements/InputGroup";
import { EmailIcon, PasswordIcon, UserIcon, CallIcon, GlobeIcon } from "@/assets/icons";

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    country: "",
    state: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.contactNumber.trim()) newErrors.contactNumber = "Contact number is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          contactNumber: formData.contactNumber,
          country: formData.country,
          state: formData.state,
          password: formData.password,
          referralCode: formData.referralCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful! Please sign in.");
        router.push("/auth/sign-in");
      } else {
        setErrors({ general: data.error || "Registration failed" });
      }
    } catch (error) {
      setErrors({ general: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {errors.general && (
        <div className="mb-4.5 rounded-lg bg-danger/10 px-4 py-3 text-danger">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <InputGroup
          type="text"
          label="Full Name"
          className="mb-4.5 [&_input]:py-[15px]"
          placeholder="Enter your full name"
          name="name"
          handleChange={handleChange}
          value={formData.name}
          icon={<UserIcon />}
        />
        {errors.name && <p className="mt-1 text-sm text-danger">{errors.name}</p>}

        <InputGroup
          type="email"
          label="Email"
          className="mb-4.5 [&_input]:py-[15px]"
          placeholder="Enter your email"
          name="email"
          handleChange={handleChange}
          value={formData.email}
          icon={<EmailIcon />}
        />
        {errors.email && <p className="mt-1 text-sm text-danger">{errors.email}</p>}

        <InputGroup
          type="tel"
          label="Contact Number"
          className="mb-4.5 [&_input]:py-[15px]"
          placeholder="Enter your contact number"
          name="contactNumber"
          handleChange={handleChange}
          value={formData.contactNumber}
          icon={<CallIcon />}
        />
        {errors.contactNumber && <p className="mt-1 text-sm text-danger">{errors.contactNumber}</p>}

        <div className="grid grid-cols-2 gap-4 mb-4.5">
          <div>
            <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
              Country
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-5 py-3 pl-9 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            >
              <option value="">Select Country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="IN">India</option>
              <option value="CN">China</option>
              <option value="JP">Japan</option>
              <option value="BR">Brazil</option>
            </select>
            {errors.country && <p className="mt-1 text-sm text-danger">{errors.country}</p>}
          </div>

          <div>
            <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
              State
            </label>
            <input
              type="text"
              name="state"
              placeholder="Enter state"
              value={formData.state}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-5 py-3 pl-9 outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
            {errors.state && <p className="mt-1 text-sm text-danger">{errors.state}</p>}
          </div>
        </div>

        <InputGroup
          type="password"
          label="Password"
          className="mb-4.5 [&_input]:py-[15px]"
          placeholder="Enter your password"
          name="password"
          handleChange={handleChange}
          value={formData.password}
          icon={<PasswordIcon />}
        />
        {errors.password && <p className="mt-1 text-sm text-danger">{errors.password}</p>}

        <InputGroup
          type="password"
          label="Confirm Password"
          className="mb-4.5 [&_input]:py-[15px]"
          placeholder="Confirm your password"
          name="confirmPassword"
          handleChange={handleChange}
          value={formData.confirmPassword}
          icon={<PasswordIcon />}
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-danger">{errors.confirmPassword}</p>}

        <InputGroup
          type="text"
          label="Referral Code (Optional)"
          className="mb-5.5 [&_input]:py-[15px]"
          placeholder="Enter referral code if you have one"
          name="referralCode"
          handleChange={handleChange}
          value={formData.referralCode}
          icon={<GlobeIcon />}
        />

        <div className="mb-4.5">
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating account..." : "Create account"}
            {isLoading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent" />
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p>
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
