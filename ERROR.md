Run npm run build

> my_project@0.1.0 build
> prisma generate && next build

Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.12.0) to ./node_modules/@prisma/client in 353ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate

⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

   ▲ Next.js 15.4.4
   - Experiments (use with caution):
     ⨯ serverMinification

   Creating an optimized production build ...
 ✓ Compiled successfully in 18.0s
   Linting and checking validity of types ...
Failed to compile.

app/api/chat/channels/[channelId]/events/route.ts
Type error: Route "app/api/chat/channels/[channelId]/events/route.ts" does not match the required types of a Next.js Route.
  "broadcastMessage" is not a valid Route export field.

Next.js build worker exited with code: 1 and signal: null
Error: Process completed with exit code 1.
Run if [ "success" == "success" ] && [ "failure" == "success" ]; then
❌ CI 실패! 코드를 확인해주세요.
Error: Process completed with exit code 1.
[17:29:39.022] Running build in Washington, D.C., USA (East) – iad1
[17:29:39.022] Build machine configuration: 2 cores, 8 GB
[17:29:39.050] Cloning github.com/Mrbaeksang/developers_community (Branch: main, Commit: 0cd3ee7)
[17:29:39.455] Cloning completed: 405.000ms
[17:29:43.628] Restored build cache from previous deployment (8Xfco5Lpjpz2yNuiHvW7XgTCu4i1)
[17:29:46.323] Running "vercel build"
[17:29:46.816] Vercel CLI 44.6.4
[17:29:47.170] Installing dependencies...
[17:29:48.519] 
[17:29:48.520] > my_project@0.1.0 postinstall
[17:29:48.520] > prisma generate
[17:29:48.521] 
[17:29:49.320] Prisma schema loaded from prisma/schema.prisma
[17:29:50.179] 
[17:29:50.179] ✔ Generated Prisma Client (v6.12.0) to ./node_modules/@prisma/client in 369ms
[17:29:50.180] 
[17:29:50.180] Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
[17:29:50.180] 
[17:29:50.180] Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate
[17:29:50.180] 
[17:29:50.198] 
[17:29:50.198] > my_project@0.1.0 prepare
[17:29:50.198] > husky
[17:29:50.199] 
[17:29:50.257] 
[17:29:50.257] up to date in 3s
[17:29:50.257] 
[17:29:50.257] 186 packages are looking for funding
[17:29:50.258]   run `npm fund` for details
[17:29:50.288] Detected Next.js version: 15.4.4
[17:29:50.293] Running "npm run build"
[17:29:50.407] 
[17:29:50.407] > my_project@0.1.0 build
[17:29:50.407] > prisma generate && next build
[17:29:50.407] 
[17:29:51.069] Prisma schema loaded from prisma/schema.prisma
[17:29:51.838] ┌─────────────────────────────────────────────────────────┐
[17:29:51.839] │  Update available 6.12.0 -> 6.13.0                      │
[17:29:51.839] │  Run the following to update                            │
[17:29:51.839] │    npm i --save-dev prisma@latest                       │
[17:29:51.839] │    npm i @prisma/client@latest                          │
[17:29:51.840] └─────────────────────────────────────────────────────────┘
[17:29:51.840] 
[17:29:51.840] ✔ Generated Prisma Client (v6.12.0) to ./node_modules/@prisma/client in 396ms
[17:29:51.840] 
[17:29:51.840] Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
[17:29:51.841] 
[17:29:51.841] Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate
[17:29:51.841] 
[17:29:53.006]    ▲ Next.js 15.4.4
[17:29:53.007]    - Experiments (use with caution):
[17:29:53.007]      ⨯ serverMinification
[17:29:53.008] 
[17:29:53.050]    Creating an optimized production build ...
[17:30:06.254]  ✓ Compiled successfully in 13.0s
[17:30:06.260]    Linting and checking validity of types ...
[17:30:25.684] Failed to compile.
[17:30:25.684] 
[17:30:25.685] app/api/chat/channels/[channelId]/events/route.ts
[17:30:25.685] Type error: Route "app/api/chat/channels/[channelId]/events/route.ts" does not match the required types of a Next.js Route.
[17:30:25.685]   "broadcastMessage" is not a valid Route export field.
[17:30:25.685] 
[17:30:25.750] Next.js build worker exited with code: 1 and signal: null
[17:30:25.800] Error: Command "npm run build" exited with 1
[17:30:26.111] 
[17:30:29.186] Exiting build container
[{
	"resource": "/c:/Users/qortk/IdeaProjects/my_project/app/api/chat/channels/[channelId]/messages/[messageId]/route.ts",
	"owner": "eslint",
	"code": {
		"value": "@typescript-eslint/no-unused-vars",
		"target": {
			"$mid": 1,
			"path": "/rules/no-unused-vars",
			"scheme": "https",
			"authority": "typescript-eslint.io"
		}
	},
	"severity": 8,
	"message": "'channelId' is assigned a value but never used.",
	"source": "eslint",
	"startLineNumber": 145,
	"startColumn": 13,
	"endLineNumber": 145,
	"endColumn": 22,
	"origin": "extHost1"
}][{
	"resource": "/C:/Users/qortk/IdeaProjects/my_project/components/chat/FloatingChatButton.tsx",
	"owner": "typescript",
	"code": "7006",
	"severity": 8,
	"message": "'message' 매개 변수에는 암시적으로 'any' 형식이 포함됩니다.",
	"source": "ts",
	"startLineNumber": 85,
	"startColumn": 21,
	"endLineNumber": 85,
	"endColumn": 28,
	"origin": "extHost1"
}]