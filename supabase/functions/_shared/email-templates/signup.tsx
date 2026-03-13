/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const logoUrl = 'https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Confirmez votre email – KiteSurf Passion</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={logoUrl} alt="KiteSurf Passion" width="180" style={logo} />
        </Section>
        <Heading style={h1}>Bienvenue chez KiteSurf Passion 🪁</Heading>
        <Text style={text}>
          Merci de vous être inscrit sur{' '}
          <Link href={siteUrl} style={link}>
            <strong>KiteSurf Passion</strong>
          </Link>{' '}
          !
        </Text>
        <Text style={text}>
          Confirmez votre adresse email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) en cliquant sur le bouton ci-dessous :
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmer mon email
        </Button>
        <Text style={footerNote}>
          Si vous n'avez pas créé de compte, ignorez simplement cet email.
        </Text>
        <Section style={footerBrand}>
          <Text style={footerText}>
            📍 Spot de l'Almanarre, Hyères (Var) · Première école de kitesurf du Var depuis 1999
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Montserrat, Inter, Arial, sans-serif' }
const container = { padding: '0', maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#0F172A', padding: '24px 25px', textAlign: 'center' as const }
const logo = { margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '24px 25px 16px' }
const text = { fontSize: '15px', color: '#64748B', lineHeight: '1.6', margin: '0 25px 20px' }
const link = { color: '#0891B2', textDecoration: 'underline' }
const button = { backgroundColor: '#F97316', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const, margin: '8px 25px 24px' }
const footerNote = { fontSize: '12px', color: '#94a3b8', margin: '0 25px 24px' }
const footerBrand = { backgroundColor: '#0F172A', padding: '16px 25px', textAlign: 'center' as const }
const footerText = { fontSize: '12px', color: '#94a3b8', margin: '0' }
