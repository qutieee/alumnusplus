import "@/styles/globals.css";

import {
	$accountData,
	$accountDetails,
	$accountType,
	$themeMode,
} from "@/lib/globalStates";
import { IUserHunter, IUserProvisioner } from "@/lib/types";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AnimatePresence } from "framer-motion";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { tanstackClient } from "@/lib/tanstack";

const AppBar = dynamic(() => import("@/components/AppBar"), { ssr: false });
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

export default function App({ Component, pageProps, router }: AppProps) {
	const { initialSession } = pageProps;

	const checkUser = async () => {
		const { data } = await supabase.auth.getUser();

		if (data.user) {
			let metadata = data.user?.user_metadata as IUserHunter | IUserProvisioner;

			if (metadata && metadata.type === "hunter") {
				$accountType.set("hunter");
				const { data: newData, error } = await supabase
					.from("user_hunters")
					.select("*")
					.eq("id", data.user?.id)
					.single();

				if (error) {
					console.log(error);
					return;
				} else {
					$accountDetails.set({
						...newData,
						id: data.user?.id as string,
					});
					$accountData.set({
						created_at: data.user?.created_at as string,
						email: data.user?.email as string,
						id: data.user?.id as string,
						email_confirmed_at: data.user?.email_confirmed_at as string,
						phone: data.user?.phone as string,
						raw_user_meta_data: metadata,
					});
				}
			} else if (metadata && metadata.type === "provisioner") {
				$accountType.set("provisioner");
				const { data: newData, error } = await supabase
					.from("user_provisioners")
					.select("*")
					.eq("id", data.user?.id)
					.single();

				if (error) {
					console.log(error);
					return;
				} else {
					$accountDetails.set({
						...newData,
						id: data.user?.id as string,
					});
					$accountData.set({
						created_at: data.user?.created_at as string,
						email: data.user?.email as string,
						id: data.user?.id as string,
						email_confirmed_at: data.user?.email_confirmed_at as string,
						phone: data.user?.phone as string,
						raw_user_meta_data: metadata,
					});
				}
			}

			// change route depending on account type
			if (router.pathname === "/") {
				if (metadata.type === "hunter") {
					router.push("/h/feed");
				} else if (metadata.type === "provisioner") {
					router.push("/p/dashboard");
				}
			}
		}
	};

	useEffect(() => {
		checkUser();

		// get theme from localStorage
		const theme = localStorage.getItem("theme");

		// set to global theme state
		if (theme) {
			$themeMode.set(theme as "light" | "dark");
			document.documentElement.setAttribute("data-theme", theme);
		}
	});

	return (
		<>
			<Head>
				<title>Wicket - A web3 social media platform</title>

				<meta name="viewport" content="initial-scale=1.0, width=device-width" />
				<meta charSet="utf-8" />

				<link rel="icon" href="/logo/wicket-new-adaptive.png" />

				<link rel="manifest" href="/manifest.json" />
			</Head>

			<SessionContextProvider
				supabaseClient={supabase}
				initialSession={initialSession}
			>
				<QueryClientProvider client={tanstackClient}>
					<>
						<AppBar />
						<Navbar />

						<div className="flex justify-center bg-base-100 overflow-x-hidden">
							<div className="w-full max-w-5xl px-5 lg:px-0 min-h-screen pt-16 lg:pt-0">
								<AnimatePresence mode="wait">
									<Component
										{...pageProps}
										rotuer={router}
										key={router.pathname}
									/>
								</AnimatePresence>
							</div>
						</div>

						<ReactQueryDevtools initialIsOpen={false} />
					</>
				</QueryClientProvider>
			</SessionContextProvider>

			<Toaster position="bottom-center" />
		</>
	);
}
