import { Redirect } from "wouter";
import { Show } from "@clerk/react";
import { LandingPage } from "@/pages/landing";

export default function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/overview" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}
