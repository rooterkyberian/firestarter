/**
 * Social Media Extractor Feature
 * Extracts and displays social media links from profiles
 */

import { getReportButton, analyzeProfile } from '../profileAnalyzer';
import { getOrAddChildNode, createLink } from '@shared/utils/dom';

/**
 * Add social media links to profile UI
 */
export function addSocialLinks(): void {
  const profile = analyzeProfile();

  if (Object.keys(profile.socialMedia).length === 0) {
    return;
  }

  console.log('Found social media:', profile.socialMedia);

  const reportBtn = getReportButton();
  if (!reportBtn || !reportBtn.parentNode) {
    return;
  }

  const socialLinksDiv = getOrAddChildNode(
    reportBtn.parentNode as HTMLElement,
    'socialLinks'
  );

  // Clear existing links
  socialLinksDiv.innerHTML = '';

  // Add Instagram link
  const instagramName = profile.socialMedia['instagram'];
  if (instagramName) {
    const link = createLink(
      `📸 Instagram: ${instagramName}`,
      `https://instagram.com/${instagramName}`
    );
    link.style.display = 'block';
    link.style.marginTop = '8px';
    link.style.color = '#E4405F';
    link.style.textDecoration = 'none';
    link.style.fontSize = '14px';
    socialLinksDiv.appendChild(link);
  }

  // Add Snapchat link
  const snapchatName = profile.socialMedia['snapchat'];
  if (snapchatName) {
    const link = createLink(
      `👻 Snapchat: ${snapchatName}`,
      `https://snapchat.com/add/${snapchatName}`
    );
    link.style.display = 'block';
    link.style.marginTop = '8px';
    link.style.color = '#FFFC00';
    link.style.textDecoration = 'none';
    link.style.fontSize = '14px';
    socialLinksDiv.appendChild(link);
  }

  // Add Facebook link
  const facebookName = profile.socialMedia['facebook'];
  if (facebookName) {
    const link = createLink(
      `📘 Facebook: ${facebookName}`,
      `https://facebook.com/${facebookName}`
    );
    link.style.display = 'block';
    link.style.marginTop = '8px';
    link.style.color = '#1877F2';
    link.style.textDecoration = 'none';
    link.style.fontSize = '14px';
    socialLinksDiv.appendChild(link);
  }
}
