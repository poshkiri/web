import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface PurchaseConfirmationProps {
  assetName: string;
  previewImageUrl?: string;
  downloadUrl: string;
  buyerEmail?: string;
  appName?: string;
}

export function PurchaseConfirmation({
  assetName,
  previewImageUrl,
  downloadUrl,
  buyerEmail,
  appName = "GameAssets",
}: PurchaseConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Your purchase: {assetName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thank you for your purchase</Heading>
          <Text style={text}>You have successfully purchased:</Text>
          <Section style={assetSection}>
            <Heading as="h2" style={h2}>
              {assetName}
            </Heading>
            {previewImageUrl && (
              <Img
                src={previewImageUrl}
                alt={assetName}
                width={320}
                style={previewImg}
              />
            )}
          </Section>
          <Section style={buttonSection}>
            <Button style={button} href={downloadUrl}>
              Download Now
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={instructions}>
            <strong>How to use your asset:</strong>
          </Text>
          <Text style={text}>
            1. Click &quot;Download Now&quot; above (link is valid for 1 hour).
            <br />
            2. Extract the archive if needed and import into your project (Unity /
            Unreal / Godot).
            <br />
            3. You can always find this asset in your account under Purchases →
            My Resources.
          </Text>
          {buyerEmail && (
            <Text style={footer}>Sent to {buyerEmail}</Text>
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

const h2 = {
  color: "#1a1a2e",
  fontSize: "18px",
  fontWeight: "600" as const,
  margin: "0 0 12px",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const assetSection = {
  margin: "24px 0",
  padding: "16px",
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
};

const previewImg = {
  borderRadius: "8px",
  maxWidth: "100%",
  height: "auto",
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

const instructions = {
  color: "#1a1a2e",
  fontSize: "16px",
  margin: "0 0 8px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  margin: "24px 0 0",
};

export default PurchaseConfirmation;
