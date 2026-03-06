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

export interface SaleNotificationProps {
  assetTitle: string;
  amountAfterCommission: number;
  earningsUrl: string;
  sellerEmail?: string;
  appName?: string;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function SaleNotification({
  assetTitle,
  amountAfterCommission,
  earningsUrl,
  sellerEmail,
  appName = "GameAssets",
}: SaleNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Sale: {assetTitle} — {formatPrice(amountAfterCommission)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You made a sale</Heading>
          <Text style={text}>Someone purchased your asset:</Text>
          <Section style={highlightSection}>
            <Text style={assetTitleStyle}>{assetTitle}</Text>
            <Text style={amountStyle}>
              You receive: <strong>{formatPrice(amountAfterCommission)}</strong> (after platform fee)
            </Text>
          </Section>
          <Section style={buttonSection}>
            <Button style={button} href={earningsUrl}>
              View Earnings
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

const highlightSection = {
  margin: "24px 0",
  padding: "20px",
  backgroundColor: "#ecfdf5",
  borderRadius: "8px",
  borderLeft: "4px solid #10b981",
};

const assetTitleStyle = {
  color: "#1a1a2e",
  fontSize: "18px",
  fontWeight: "600" as const,
  margin: "0 0 8px",
};

const amountStyle = {
  color: "#065f46",
  fontSize: "16px",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button = {
  backgroundColor: "#6366f1",
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

export default SaleNotification;
