import React from 'react';
import Link from 'next/link';
import '@flaticon/flaticon-uicons/css/all/all.css';
import styles from "./styles/MainFooter.module.css";

const MainFooter = () => {
  const footerLinks = {
    company: {
      title: 'Company',
      links: [
        { name: 'About', href: 'https://hitmakr.gitbook.io/hitmakr-whitepaper/intro/philosophy' },
        { name: 'Tokenomics', href: 'https://hitmakr.gitbook.io/hitmakr-whitepaper/tokenomics' },
        { name: 'News', href: 'https://mirror.xyz/0xB5e80530244F95F4290aD33f5fA5cB28B73B4593' }
      ]
    },
    communities: {
      title: 'Communities',
      links: [
        { name: 'For Artists', href: 'https://discord.com/channels/1245147894395175037/1306408127134044211' },
        { name: 'For Producers', href: 'https://discord.com/channels/1245147894395175037/1306408791117398110' },
        { name: 'Partners', href: 'https://discord.com/channels/1245147894395175037/1306410124050567228' }
      ]
    },
    useful: {
      title: 'Useful Links',
      links: [
        { name: 'Support', href: 'https://discord.com/invite/TXHEubf2eM' },
        { name: 'Brand Kit', href: 'https://github.com/0xhitmakr/hitmakr-assets' },
      ]
    },
    resources: {
      title: 'Supported Chains',
      links: [
        { name: 'Skale Network', href: 'https://skale.space/' },
        { name: 'More to come', href: 'https://mirror.xyz/0xB5e80530244F95F4290aD33f5fA5cB28B73B4593' },
      ]
    }
  };

  const socialLinks = [
    { name: 'Twitter', href: 'https://x.com/hitmakrr/', icon: 'fi-brands-twitter-alt' },
    { name: 'linkedin', href: 'https://www.linkedin.com/company/hitmakr?trk=similar-pages', icon: 'fi-brands-linkedin' },
    { name: 'Discord', href: 'https://discord.com/invite/TXHEubf2eM', icon: 'fi-brands-discord' },
    { name: 'Telegram', href: 'https://t.me/Hitmakr_Portal', icon: 'fi-brands-telegram' }
  ];

  const legalLinks = [
    { name: 'Legal', href: 'https://mirror.xyz/0xB5e80530244F95F4290aD33f5fA5cB28B73B4593/pzL-6rYja-nX3yF-ciQnkhKWvHgXRNnn8XrJ-tGcZiQ' },
    { name: 'Privacy Center', href: 'https://mirror.xyz/0xB5e80530244F95F4290aD33f5fA5cB28B73B4593/XhqhggYwVjA69c4rc6-vtUOqsp0Q0zJkrHL-Q1OIiXc' },
    { name: 'Terms of Use', href: 'https://mirror.xyz/0xB5e80530244F95F4290aD33f5fA5cB28B73B4593/exKwR0S3ejOjAgEQsgXxfNJMsInKMpJiaez1mUiMmqE' },
    { name: 'Cookies', href: 'https://mirror.xyz/0xB5e80530244F95F4290aD33f5fA5cB28B73B4593/5wvvutsungHfbdic0kD-OgOTo6X81WF5T44aNI61u60' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.gridContainer}>
          {Object.values(footerLinks).map((section) => (
            <div key={section.title} className={styles.section}>
              <h3 className={styles.sectionTitle}>{section.title}</h3>
              <ul className={styles.linkList}>
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link target='_blank' href={link.href} className={styles.link}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.socialContainer}>
          {socialLinks.map((social) => (
            <Link 
              key={social.name}
              href={social.href} 
              className={styles.socialLink}
              aria-label={social.name}
              target='_blank'
            >
              <i className={`fi ${social.icon}`}></i>
            </Link>
          ))}
        </div>

        <div className={styles.legalSection}>
          <div className={styles.legalLinks}>
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={styles.legalLink}
                target='_blank'
              >
                {link.name}
              </Link>
            ))}
          </div>
          <p className={styles.copyright}>© 2024 Hitmakr</p>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;