export async function sendLineGroupMessage(params: {
    channelAccessToken: string
    groupId: string
    text: string
}) {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
            authorization: `Bearer ${params.channelAccessToken}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            to: params.groupId,
            messages: [
                {
                    type: "text",
                    text: params.text,
                },
            ],
        }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to send LINE message")
    }
}
