'use server';
/**
 * @fileOverview An AI assistant for traders to generate context-specific communication messages.
 *
 * - traderAICommunicationAssistant - A function that handles generating trader communication messages.
 * - TraderAICommunicationAssistantInput - The input type for the traderAICommunicationAssistant function.
 * - TraderAICommunicationAssistantOutput - The return type for the traderAICommunicationAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TraderAICommunicationAssistantInputSchema = z.object({
  messageType: z
    .enum(['sellInstructions', 'receiveConfirmation'])
    .describe('The type of message to generate: instructions for selling crypto or confirmation of receipt.'),
  tradeDetails: z.object({
    cryptoAmount: z.string().describe('The amount of cryptocurrency, e.g., "0.5 BTC".'),
    cryptoCurrency: z.string().describe('The name of the cryptocurrency, e.g., "Bitcoin", "Ethereum".'),
    network: z.string().describe('The blockchain network for the transaction, e.g., "ERC20", "BEP20", "Bitcoin Network".'),
    traderWalletAddress: z.string().describe("The trader's crypto wallet address."),
    traderWalletQrCodeUri: z
      .string()
      .optional()
      .describe(
        "A QR code for the trader's wallet, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
    clientUsername: z.string().describe("The username of the client/seller."),
    tradeId: z.string().describe('Unique identifier for the trade.'),
    fiatAmount: z.string().describe('The fiat amount involved in the trade, e.g., "1000".'),
    fiatCurrency: z.string().describe('The fiat currency, e.g., "USD", "INR".'),
  }).describe('Detailed information about the P2P trade.'),
  additionalContext: z.string().optional().describe('Any additional context or specific instructions for the AI.'),
});
export type TraderAICommunicationAssistantInput = z.infer<typeof TraderAICommunicationAssistantInputSchema>;

const TraderAICommunicationAssistantOutputSchema = z.object({
  generatedMessage: z.string().describe('The AI-generated communication message.'),
  messagePurpose: z.enum(['sellInstructions', 'receiveConfirmation']).describe('The purpose of the generated message.'),
});
export type TraderAICommunicationAssistantOutput = z.infer<typeof TraderAICommunicationAssistantOutputSchema>;

const sellInstructionsPrompt = ai.definePrompt({
  name: 'traderSellInstructionsPrompt',
  input: {schema: TraderAICommunicationAssistantInputSchema},
  output: {schema: TraderAICommunicationAssistantOutputSchema},
  prompt: `You are an AI assistant for a P2P crypto trading platform. Your goal is to generate a JSON object with a 'generatedMessage' (a string) and a 'messagePurpose' (which should be "sellInstructions").

Generate a clear, concise, and helpful step-by-step guide for the client to send cryptocurrency to a trader's wallet.

Client: {{{tradeDetails.clientUsername}}}
Trade ID: {{{tradeDetails.tradeId}}}
Crypto Amount: {{{tradeDetails.cryptoAmount}}}
Crypto Currency: {{{tradeDetails.cryptoCurrency}}}
Network: {{{tradeDetails.network}}}
Trader Wallet Address: {{{tradeDetails.traderWalletAddress}}}
{{#if tradeDetails.traderWalletQrCodeUri}}
Trader Wallet QR Code is also provided separately.
{{/if}}
Additional Context: {{{additionalContext}}}

Please provide clear and concise step-by-step instructions for {{{tradeDetails.clientUsername}}} to send {{{tradeDetails.cryptoAmount}}} of {{{tradeDetails.cryptoCurrency}}} on the {{{tradeDetails.network}}} network to the provided wallet address.
Emphasize the importance of selecting the correct cryptocurrency and **especially the correct network** to avoid any loss of funds.
Instruct them to notify the trader with proof of transaction (e.g., transaction ID or screenshot) once the transfer is complete.
The message should be polite and professional.

Provide the response in the following JSON format:

json
{
  "generatedMessage": "string",
  "messagePurpose": "sellInstructions"
}

Example 'generatedMessage' content:
"Hi {{{tradeDetails.clientUsername}}},

Please follow these steps to send {{{tradeDetails.cryptoAmount}}} {{{tradeDetails.cryptoCurrency}}} for Trade ID {{{tradeDetails.tradeId}}}:

1.  Open your crypto wallet or exchange.
2.  Select {{{tradeDetails.cryptoCurrency}}} and choose the **{{{tradeDetails.network}}}** network for withdrawal.
3.  Enter the following wallet address: \`{{{tradeDetails.traderWalletAddress}}}\`
4.  Confirm the amount: {{{tradeDetails.cryptoAmount}}}
5.  **IMPORTANT:** Double-check that you have selected the correct network ({{{tradeDetails.network}}}) and wallet address before confirming the transfer. Funds sent to the wrong network or address may be irrecoverable.
{{#if tradeDetails.traderWalletQrCodeUri}}
6. For your convenience, please refer to the QR code provided by the trader for this wallet address.
{{/if}}
Once the transfer is complete, please share the transaction ID or a screenshot of the successful transfer with me.

Thank you!
{{#if additionalContext}}
Additional notes: {{{additionalContext}}}
{{/if}}"
`
});

const receiveConfirmationPrompt = ai.definePrompt({
  name: 'traderReceiveConfirmationPrompt',
  input: {schema: TraderAICommunicationAssistantInputSchema},
  output: {schema: TraderAICommunicationAssistantOutputSchema},
  prompt: `You are an AI assistant for a P2P crypto trading platform. Your goal is to generate a JSON object with a 'generatedMessage' (a string) and a 'messagePurpose' (which should be "receiveConfirmation").

Generate a polite and clear confirmation message for a trader to send to a client after successfully receiving cryptocurrency.

Client: {{{tradeDetails.clientUsername}}}
Trade ID: {{{tradeDetails.tradeId}}}
Crypto Amount: {{{tradeDetails.cryptoAmount}}}
Crypto Currency: {{{tradeDetails.cryptoCurrency}}}
Fiat Amount: {{{tradeDetails.fiatAmount}}}
Fiat Currency: {{{tradeDetails.fiatCurrency}}}
Additional Context: {{{additionalContext}}}

Generate a message acknowledging the receipt of {{{tradeDetails.cryptoAmount}}} {{{tradeDetails.cryptoCurrency}}} from {{{tradeDetails.clientUsername}}} for Trade ID {{{tradeDetails.tradeId}}}.
Inform them that the fiat payment of {{{tradeDetails.fiatAmount}}} {{{tradeDetails.fiatCurrency}}} will be processed shortly according to the agreed payment method.
If there is any additional context, incorporate it naturally.

Provide the response in the following JSON format:

json
{
  "generatedMessage": "string",
  "messagePurpose": "receiveConfirmation"
}

Example 'generatedMessage' content:
"Hi {{{tradeDetails.clientUsername}}},

Good news! I have successfully received {{{tradeDetails.cryptoAmount}}} {{{tradeDetails.cryptoCurrency}}} for Trade ID {{{tradeDetails.tradeId}}}.
The fiat payment of {{{tradeDetails.fiatAmount}}} {{{tradeDetails.fiatCurrency}}} will now be processed to your chosen payment method.

Thank you for the smooth trade!
{{#if additionalContext}}
Additional notes: {{{additionalContext}}}
{{/if}}"
`
});

export async function traderAICommunicationAssistant(
  input: TraderAICommunicationAssistantInput
): Promise<TraderAICommunicationAssistantOutput> {
  return traderAICommunicationAssistantFlow(input);
}

const traderAICommunicationAssistantFlow = ai.defineFlow(
  {
    name: 'traderAICommunicationAssistantFlow',
    inputSchema: TraderAICommunicationAssistantInputSchema,
    outputSchema: TraderAICommunicationAssistantOutputSchema,
  },
  async (input) => {
    let response;

    if (input.messageType === 'sellInstructions') {
      response = await sellInstructionsPrompt(input);
    } else if (input.messageType === 'receiveConfirmation') {
      response = await receiveConfirmationPrompt(input);
    } else {
      throw new Error('Invalid messageType provided.');
    }

    if (!response.output) {
      throw new Error('AI did not return a message.');
    }

    return response.output;
  }
);
