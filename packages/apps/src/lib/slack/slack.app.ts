import { createApp } from '@lecca-io/toolkit';
import crypto from 'crypto';

import { createChannel } from './actions/create-channel.action';
import { slackOAuth2 } from './connections/slack.oauth2';

export const slack = createApp({
  id: 'slack',
  name: 'Slack',
  description:
    'Slack is a messaging app for business that connects people to the information they need.',
  logoUrl: 'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/slack.svg',
  actions: [createChannel],
  triggers: [],
  connections: [slackOAuth2],
  verifyWebhookRequest: ({ webhookBody, webhookHeaders }) => {
    if (!process.env.INTEGRATIONS_SLACK_SIGNING_SECRET) {
      throw new Error('Slack signing secret is not set');
    }

    // Construct the signature base string
    const timestamp = webhookHeaders['x-slack-request-timestamp'];
    const signature = webhookHeaders['x-slack-signature'];
    const signatureBaseString = `v0:${timestamp}:${webhookBody}`;
    const hmac = crypto.createHmac(
      'sha256',
      process.env.INTEGRATIONS_SLACK_SIGNING_SECRET,
    );
    hmac.update(signatureBaseString);
    const computedSignature = `v0=${hmac.digest('hex')}`;
    return signature === computedSignature;
  },
  parseWebhookEventType: (args) => {
    const webhookBody = args.webhookBody as { event?: { type?: string } };

    return {
      event: webhookBody?.event?.type ?? '',
    };
  },
  needsConnection: true,
});
