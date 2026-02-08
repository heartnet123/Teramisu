"use client";

import { authClient } from "@/lib/auth-client";
import RecommendationsSection from "@/components/recommendations-section";

export default function DashboardPage() {
	const { data: session, isPending } = authClient.useSession();
	const isLoggedIn = !!session?.user;

	return (
		<main className="min-h-screen w-full max-w-7xl mx-auto px-6 py-10">
			<div className="space-y-2 mb-10">
				<h1 className="text-2xl font-semibold">Dashboard</h1>
				{isLoggedIn && !isPending && (
					<p className="text-sm text-muted-foreground">Welcome back, {session.user.name}!</p>
				)}
			</div>

			{isLoggedIn && !isPending && (
				<RecommendationsSection
					title="Recommended for Next Purchase"
					type="personalized"
					maxProducts={3}
					className=""
				/>
			)}

			{!isLoggedIn && !isPending && (
				<div className="text-center py-16">
					<p className="text-muted-foreground">Please log in to see personalized recommendations.</p>
				</div>
			)}
		</main>
	);
}
