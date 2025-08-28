"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Script from "next/script";

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/sign-in");
      return;
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-bold text-black dark:text-white">
          Support Center
        </h2>
      </div>

      {/* Support Information */}
      <div className="mb-8 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          🎯 How Can We Help You?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💬 Live Chat Support
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Get instant help from our support team. Click the chat widget below to start a conversation.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              📧 Contact Support
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Send us an email for detailed assistance or general inquiries.
            </p>
            <a 
              href="https://ditokens.com/contact-us/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            ⚡ Quick Support Options
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• <strong>Live Chat:</strong> Available 24/7 for immediate assistance</li>
            <li>• <strong>Email Support:</strong> For detailed technical issues</li>
            <li>• <strong>FAQ:</strong> Check our knowledge base for common questions</li>
            <li>• <strong>Response Time:</strong> Live chat: Instant, Email: Within 24 hours</li>
          </ul>
        </div>
      </div>

      {/* Chat Widget Container */}
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          💬 Live Chat Support
        </h3>
        <div className="text-center p-8">
          <div className="text-4xl mb-4">💬</div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our live chat widget will appear below. If you don&apos;t see it, please refresh the page.
            </p>
          <p className="text-sm text-gray-500">
            Chat is available 24/7 for immediate assistance
          </p>
        </div>
      </div>

      {/* Tawk.to Script */}
      <Script
        id="tawk-to-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/68aef343e052891921d8328a/1j3lmcg9m';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
          `
        }}
      />
    </div>
  );
}
