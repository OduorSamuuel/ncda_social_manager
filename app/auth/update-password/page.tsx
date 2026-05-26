import { UpdatePasswordForm } from "@/components/update-password-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full">
      <UpdatePasswordForm />
      <div className="relative hidden md:block flex-1">
        <Image
          src="/images/login-bg.jpg"
          alt="Manage your Facebook presence"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-10 left-8 right-8">
          <p className="font-serif text-2xl text-white leading-snug mb-1">
            Manage your Facebook
            <br />
            presence with ease.
          </p>
          <span className="text-sm text-white/55">
            Schedule, publish, and track your posts
          </span>
        </div>
      </div>
    </div>
  );
}