import darkLogo from "@/assets/logos/ditokens-logo-dark.png";
import logo from "@/assets/logos/ditokens-logo-light.png";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-8 w-auto">
      <Image
        src={logo}
        height={32}
        width={0}
        className="dark:hidden h-8 w-auto"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
      />

      <Image
        src={darkLogo}
        height={32}
        width={0}
        className="hidden dark:block h-8 w-auto"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}

