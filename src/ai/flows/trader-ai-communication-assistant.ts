/**
 * @fileOverview An AI assistant for traders to generate context-specific communication messages.
 */

import {z} from 'zod';

export const TraderAICommunicationAssistantInputSchema = z.object({
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

export const TraderAICommunicationAssistantOutputSchema = z.object({
  generatedMessage: z.string().describe('The AI-generated communication message.'),
  messagePurpose: z.enum(['sellInstructions', 'receiveConfirmation']).describe('The purpose of the generated message.'),
});
export type TraderAICommunicationAssistantOutput = z.infer<typeof TraderAICommunicationAssistantOutputSchema>;

export async function traderAICommunicationAssistant(
  input: TraderAICommunicationAssistantInput
): Promise<TraderAICommunicationAssistantOutput> {
  // Mock implementation for static export compatibility
  let message = "";
  if (input.messageType === 'sellInstructions') {
    message = `Hi ${input.tradeDetails.clientUsername}, please send ${input.tradeDetails.cryptoAmount} ${input.tradeDetails.cryptoCurrency} on ${input.tradeDetails.network} network to: ${input.tradeDetails.traderWalletAddress}`;
  } else {
    message = `Received ${input.tradeDetails.cryptoAmount} ${input.tradeDetails.cryptoCurrency}. Processing payment of ${input.tradeDetails.fiatAmount} ${input.tradeDetails.fiatCurrency} now.`;
  }

  return {
    generatedMessage: message,
    messagePurpose: input.messageType
  };
}

