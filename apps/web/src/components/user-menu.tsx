import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-9 w-9 rounded-full" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild>
				<Link href="/login">Sign In</Link>
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="glass-button p-1 rounded-full overflow-hidden">
					{session.user.image ? (
						<img src={session.user.image} alt={session.user.name} className="w-8 h-8 rounded-full object-cover" />
					) : (
						<span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 text-sm font-medium text-stone-800">
							{session.user.name?.charAt(0).toUpperCase() ?? "U"}
						</span>
					)}
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent className="bg-card">
				<DropdownMenuLabel className="font-medium">{session.user.name}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/profile" className="w-full block px-2 py-1">Profile</Link>
				</DropdownMenuItem>

				<DropdownMenuItem asChild>
					<button
						className="w-full"
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										router.push("/");
									},
								},
							});
						}}
					>
						Sign Out
					</button>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
