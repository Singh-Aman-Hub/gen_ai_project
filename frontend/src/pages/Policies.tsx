import PageContainer from "@/components/layout/PageContainer";

const policySections = [
	{
		title: "1. Introduction",
		content: `Welcome! Your privacy and trust are paramount to us. This page explains how we handle your information, documents, and interactions with our website. By using this platform, you agree to the practices described below.\n\nWe prioritize:\n  •  User anonymity: Your identity is yours, not ours.\n  •  Data minimalism: We do not store personal information longer than necessary.\n  •  Transparency: You know exactly what happens with your data.`
	},
	{
		title: "2. Information We Collect",
		content: `We collect minimal information, only what is necessary to provide our services. Examples include:\n  •  Uploaded documents or files.\n  •  Your requests, queries, or messages on the platform.\n  •  Optional metadata required for technical processing (like session IDs or temporary caches).\n\nImportant: We do not collect or store your:\n  •  Names, emails, phone numbers (unless explicitly provided for optional features).\n  •  IP addresses or location data.\n  •  Any personally identifiable information (PII) beyond your session usage.`
	},
	{
		title: "3. How Your Data is Handled",
		content: `•  Temporary Storage Only: Any data (like chats, uploaded files, or queries) is only stored temporarily in memory for processing.\n•  Automatic Deletion:\n  •  Once you log out or close your session, all session data is immediately deleted.\n  •  Upon request, all uploaded files, chat histories, and related content are permanently deleted from our servers.\n•  No Third-Party Sharing: Your data is never sold, shared, or used for advertising.`
	},
	{
		title: "4. User Anonymity",
		content: `We are serious about anonymity:\n  •  No user accounts are required for basic usage.\n  •  No personally identifiable information is stored by default.\n  •  All user actions on the platform are anonymous unless you voluntarily provide information for specific services.`
	},
	{
		title: "5. Uploaded Documents & Files",
		content: `•  Secure Handling: Files you upload are only used for processing your request.\n•  Automatic Deletion: Once the processing is done, files are immediately removed from our servers.\n•  Optional Retention: We may temporarily cache data strictly for processing purposes, but it is never accessible beyond your session.\n\nBottom line: Nothing you upload stays on our servers unless you explicitly request it to.`
	},
	{
		title: "6. Data Deletion Requests",
		content: `You have the right to delete your data at any time:\n  •  Submit a deletion request through the platform.\n  •  Upon receiving your request, we will permanently remove all associated data, including chats, uploads, and logs.\n  •  Once deleted, your data cannot be recovered.`
	},
	{
		title: "7. Cookies & Tracking",
		content: `•  We do not use tracking cookies for advertising.\n•  Minimal cookies may be used for technical purposes like maintaining sessions, but these do not store any personal information.\n•  You can delete or block cookies anytime without affecting your anonymity.`
	},
	{
		title: "8. Legal Compliance",
		content: `We comply with relevant privacy and data protection laws, including:\n  •  GDPR (General Data Protection Regulation) for EU users.\n  •  CCPA (California Consumer Privacy Act) for California users.\n  •  Local data protection regulations applicable in your region.\n\nYou are entitled to:\n  •  Access your data (if any is stored temporarily).\n  •  Request deletion of your data.\n  •  Object to any processing.`
	},
	{
		title: "9. Security Measures",
		content: `We implement strict technical measures to ensure your data’s safety during active sessions:\n  •  Encrypted connections (HTTPS/TLS).\n  •  Temporary in-memory storage for processing.\n  •  Regular security audits for vulnerabilities.\n\nRemember: Once your session ends or your data is deleted, it is permanently gone.`
	},
	{
		title: "10. Disclaimer",
		content: `While we take extensive precautions:\n  •  We cannot guarantee the security of data during transmission over the internet.\n  •  By using the platform, you acknowledge these limits and agree to use the service responsibly.`
	},
	{
		title: "11. Updates to This Policy",
		content: `We may update this page occasionally to reflect new features or regulations.\n  •  The latest version will always be posted here.\n  •  Continued use of the platform after updates constitutes acceptance of the updated policy.`
	},
	{
		title: "12. Contact Us",
		content: `For concerns or deletion requests:\n  •  Email: [support@yourwebsite.com]\n  •  Message via the platform’s support system.\n\nWe will respond promptly and ensure your data and privacy are fully respected.`
	}
];

export default function Policies() {
	return (
		<div
			className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 py-12 flex items-center justify-center"
			style={{ fontFamily: "Times New Roman, Times, serif" }}
		>
			<PageContainer>
				<div
					className="max-w-3xl mx-auto bg-white/90 rounded-xl shadow-2xl border border-blue-300 p-8"
					style={{ fontFamily: "Times New Roman, Times, serif" }}
				>
					<h1
						className="text-3xl font-extrabold mb-8 text-center text-blue-900 tracking-wide drop-shadow-lg"
						style={{ fontFamily: "Times New Roman, Times, serif" }}
					>
						Privacy &amp; Policy
					</h1>
					{policySections.map((section, idx) => (
						<section key={section.title} className="mb-7">
							<h2
								className="text-lg font-bold mb-2 text-blue-700 border-l-4 border-blue-400 pl-2"
								style={{ fontFamily: "Times New Roman, Times, serif" }}
							>
								{section.title}
							</h2>
							<pre
								className="whitespace-pre-wrap text-[15px] text-blue-900 leading-relaxed bg-blue-50/60 rounded-lg p-4 border border-blue-100"
								style={{
									fontFamily: "Times New Roman, Times, serif",
									fontSize: "15px"
								}}
							>
								{section.content}
							</pre>
						</section>
					))}
					
				</div>
			</PageContainer>
		</div>
	);
}
