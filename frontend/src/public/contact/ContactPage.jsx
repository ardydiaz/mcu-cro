import { useSearchParams } from 'react-router-dom'
import { HiOutlineBuildingOffice2, HiOutlineClipboardDocumentList, HiOutlineUserGroup } from 'react-icons/hi2'
import PageHero from '../../components/PageHero.jsx'
import { SITE, SOCIAL_LINKS } from '../../constants/site.js'
import useReveal from '../../hooks/useReveal.js'
import { ContactForm, ContactInfo } from '../home/ContactSection.jsx'
import '../home/home.css'
import '../public-pages.css'

// Requirements §8 Contact / Community Coordination: CRO contact information and
// the coordination channels for partner communities.
const CHANNELS = [
  {
    Icon: HiOutlineUserGroup,
    title: 'Barangays and organizations',
    text: 'To request an outreach activity, medical mission or seminar for your community, choose “Request a service” in the form, or call the office.',
  },
  {
    Icon: HiOutlineBuildingOffice2,
    title: 'Partnerships',
    text: 'Schools, organizations and agencies who want to partner with MCU can coordinate a meeting with the Community Relations Office.',
  },
  {
    Icon: HiOutlineClipboardDocumentList,
    title: 'Colleges and departments',
    text: 'MCU colleges and departments coordinate activities and share their learning materials through the CRO admin portal.',
  },
]

export default function ContactPage() {
  const [params] = useSearchParams()
  const ref = useReveal()

  return (
    <div ref={ref}>
      <PageHero eyebrow={SITE.name} title="Contact & Community Coordination">
        Reach the Community Relations Office, or coordinate an activity with your community.
      </PageHero>

      <section className="section contact" aria-labelledby="contact-title">
        <div className="container contact__grid">
          <div className="contact__intro reveal">
            <span className="eyebrow">Get in touch</span>
            <h2 id="contact-title">Send us a message</h2>
            <p>We usually reply within a few working days.</p>
            <ContactInfo />
            <ul className="social-row" aria-label="MCU on social media">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer" aria-label={label}>
                    <Icon aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <ContactForm initialTopic={params.get('topic') ?? 'general'} />
        </div>
      </section>

      <section className="section section--tinted" aria-labelledby="channels-title">
        <div className="container">
          <h2 id="channels-title" className="block-title">
            Coordination channels
          </h2>
          <ul className="channel-grid">
            {CHANNELS.map(({ Icon, title, text }) => (
              <li key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
