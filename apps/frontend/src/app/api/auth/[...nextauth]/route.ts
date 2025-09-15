import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const handler = NextAuth({
	providers: [
		Credentials({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email', placeholder: 'driver@example.com' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;
				try {
					const res = await axios.post(`${apiBase}/auth/login`, {
						email: credentials.email,
						password: credentials.password,
					});
					const { token, user } = res.data;
					return { id: user.id, name: user.name, email: user.email, role: user.role, accessToken: token } as any;
				} catch (e) {
					return null;
				}
			},
		}),
	],
	pages: {
		signIn: '/login',
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.accessToken = (user as any).accessToken;
				token.role = (user as any).role;
				token.id = (user as any).id;
			}
			return token;
		},
		async session({ session, token }) {
			(session as any).accessToken = token.accessToken;
			(session.user as any).role = token.role;
			(session.user as any).id = token.id;
			return session;
		},
	},
	session: { strategy: 'jwt' },
	secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
