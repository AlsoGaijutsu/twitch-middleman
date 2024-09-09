interface TwitchEmoteResponse {
    data: TwitchEmote[];
    template: string;
}

interface TwitchEmote {
    id: string;
    name: string;
    images: TwitchEmoteImages;
}

interface TwitchEmoteImages {
    url_1x: string;
    url_2x: string;
    url_4x: string;
}

// Fetch global Twitch emotes
async function fetchTwitchEmotes(channelId: string, env: Env): Promise<TwitchEmote[]> {
    const response = await fetch(`${env.TWITCH_API_URL}/chat/emotes/global`, {
        headers: {
            'Client-ID': env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${await fetchAccessToken(env)}`,
        },
    });
    
    if (!response.ok) {
        throw new Error(`Error fetching emotes: ${response.statusText}`);
    }
    
    let emoteResponse: TwitchEmoteResponse = await response.json();
    let emotes: TwitchEmote[] = emoteResponse.data;
    
    // Fetch channel-specific emotes
    const channelResponse = await fetch(`${env.TWITCH_API_URL}/chat/emotes/?broadcaster_id=${channelId}`, {
        headers: {
            'Client-ID': env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${await fetchAccessToken(env)}`,
        },
    });
    
    if (!channelResponse.ok) {
        throw new Error(`Error fetching channel emotes: ${channelResponse.statusText}`);
    }
    
    let channelEmoteResponse: TwitchEmoteResponse = await channelResponse.json();
    
    return emotes.concat(channelEmoteResponse.data);
}

// Fetch Twitch OAuth token
async function fetchAccessToken(env: Env): Promise<string> {
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: env.TWITCH_CLIENT_ID,
            client_secret: env.TWITCH_CLIENT_SECRET,
            grant_type: "client_credentials",
        }),
    });
    
    if (!tokenResponse.ok) {
        throw new Error(`Error fetching access token: ${tokenResponse.statusText}`);
    }
    
    const tokenData: any = await tokenResponse.json();
    return tokenData.access_token;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        try {
            const channelId: string = request.url.split("/").pop() as string;
            const emotes = await fetchTwitchEmotes(channelId, env);
            
            return new Response(JSON.stringify(emotes), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            return new Response(`Error: ${error.message}`, { status: 500 });
        }
    },
} satisfies ExportedHandler<Env>;