import { Bricolage_Grotesque, Inter } from 'next/font/google';

export const fontBricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
  variable: '--font-bricolage-login',
});

export const fontInter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter-login',
});
