import React from "react";
import FeatureCard from "./FeatureCard";
import { TbUserCheck, TbMessages, TbBellRinging, TbShieldLock } from "react-icons/tb";

const features = [
  {
    heading: "Personalized Profiles",
    description: "Custom bios, profile avatars, and easy privacy controls for your public identity.",
    icon: <TbUserCheck className="w-6 h-6" />
  },
  {
    heading: "Real-Time Messaging",
    description: "Instant delivery powered by Socket.IO with typing indicators and online statuses.",
    icon: <TbMessages className="w-6 h-6" />
  },
  {
    heading: "Live Notifications",
    description: "Real-time alerts for incoming friend requests, new connections, and chat activity.",
    icon: <TbBellRinging className="w-6 h-6" />
  },
  {
    heading: "Focused & Private",
    description: "Direct peer-to-peer friend requests ensuring only mutual connections can message you.",
    icon: <TbShieldLock className="w-6 h-6" />
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mt-2">
            Why choose Converso?
          </h2>
          <p className="mt-3 text-zinc-600 text-sm sm:text-base">
            Engineered from the ground up for reliable real-time communication without unnecessary complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              heading={feature.heading}
              desc={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

