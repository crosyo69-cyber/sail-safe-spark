/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const logoUrl = 'https://unqxudbxxzzmmbwwxwcr.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre code de vérification – KiteSurf Passion</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={logoUrl} alt="KiteSurf Passion" width="180" style={logo} />
        </Section>
        <Heading style={h1}>Code de vérification</Heading>
        <Text style={text}>Utilisez le code ci-dessous pour confirmer votre identité :</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footerNote}>
          Ce code expire rapidement. Si vous n'avez pas fait cette demande, ignorez cet email.
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

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Montserrat, Inter, Arial, sans-serif' }
const container = { padding: '0', maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#0F172A', padding: '24px 25px', textAlign: 'center' as const }
const logo = { margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '24px 25px 16px' }
const text = { fontSize: '15px', color: '#64748B', lineHeight: '1.6', margin: '0 25px 20px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: 'bold' as const, color: '#0891B2', margin: '0 25px 30px', letterSpacing: '4px' }
const footerNote = { fontSize: '12px', color: '#94a3b8', margin: '0 25px 24px' }
const footerBrand = { backgroundColor: '#0F172A', padding: '16px 25px', textAlign: 'center' as const }
const footerText = { fontSize: '12px', color: '#94a3b8', margin: '0' }
