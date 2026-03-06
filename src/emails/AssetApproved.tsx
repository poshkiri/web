import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface AssetApprovedProps {
  assetTitle: string;
  assetUrl: string;
  sellerEmail?: string;
  appName?: string;
}

export function AssetApproved({
  assetTitle,
  assetUrl,
  sellerEmail,
  appName = "GameAssets",
}: AssetApprovedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your asset "{assetTitle}" is now live</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Asset approved</Heading>
          <Text style={text}>
            Your asset <strong>{assetTitle}</strong> has been reviewed and is now
            live on the marketplace.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={assetUrl}>
              View asset
            </Button>
          </Section>
          <Hr style={hr} />
          {sellerEmail && (
            <Text style={footer}>Sent to {sellerEmail}</Text>
          )}
          <Text style={footer}>— {appName}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const h1 = {
  color: "#1a1a2e",
  fontSize: "24px",
  fontWeight: "600" as const,
  margin: "0 0 20px",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  margin: "24px 0 0",
};

export default AssetApproved;
