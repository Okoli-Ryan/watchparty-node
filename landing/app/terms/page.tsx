import type { Metadata } from 'next';
import LegalBar from '../components/LegalBar';
import { LEGAL } from '../legal';

// The Terms of Service, served at /terms. Placeholders (operator, governing law...) live in app/legal.ts.
// A plain-language starting point, not legal advice: have it reviewed before you charge money or grow large.

export const metadata: Metadata = {
  title: 'Terms of Service: WatchParty Sync',
  description: 'The rules for using the WatchParty Sync extension and service.',
  alternates: { canonical: '/terms' },
};

export default function Terms() {
  const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

  return (
    <>
      <LegalBar />

      <main className="wrap legal">
        <h1>Terms of Service</h1>
        <p className="legal__date">Last updated: {LEGAL.lastUpdated}</p>

        <p>
          These terms are an agreement between you and <strong>{LEGAL.operator}</strong> (&quot;we&quot;, &quot;us&quot;)
          about your use of the WatchParty Sync browser extension and the WatchParty service it connects to at{' '}
          <strong>{LEGAL.apiDomain}</strong> (together, &quot;the service&quot;). By creating an account or using the
          service you agree to them. If you don&apos;t agree, don&apos;t use the service.
        </p>

        <h2>1. What the service is</h2>
        <p>
          WatchParty Sync keeps the playback of a video on a web page in step for a group of people, and gives that
          group a chat. It controls the video player that is already on the page in each person&apos;s own browser. It
          does not host, copy, stream or re-broadcast any video.
        </p>

        <h2>2. Who can use it</h2>
        <ul>
          <li>You must be at least 13 years old, or the minimum age for using online services without parental consent where you live, if that is higher.</li>
          <li>If you use the service on behalf of an organisation, you confirm that you can accept these terms for it.</li>
        </ul>

        <h2>3. Your account</h2>
        <ul>
          <li>Give a real e-mail address you control, and keep your password private. You are responsible for what happens under your account.</li>
          <li>Tell us at {mail} if you think someone else has accessed your account.</li>
          <li>Your display name is shown to other people in your rooms. Don&apos;t use a name that impersonates someone else or is offensive.</li>
        </ul>

        <h2>4. Videos and other websites</h2>
        <ul>
          <li>
            Everyone in a room watches the video through their own access to the website it is on. You need your own
            right to watch it, for example your own subscription, and you must follow that website&apos;s terms.
          </li>
          <li>
            Don&apos;t use the service to show a video to people who aren&apos;t allowed to see it, or to get round a
            paywall, region lock, age gate or other access control.
          </li>
          <li>
            WatchParty Sync is not affiliated with, endorsed by or sponsored by any website or video service you use it
            on. Those websites are run by their owners, and we are not responsible for their content or availability.
          </li>
        </ul>

        <h2>5. Rooms and chat</h2>
        <p>
          You are responsible for what you post: room names, the pages you share and your chat messages. The room list,
          including each room&apos;s name, page URL and host, is visible to every signed-in user, so don&apos;t put
          anything private in a public room&apos;s name.
        </p>
        <p>
          You keep any rights you have in what you post. You give us permission to store, transmit and display it only
          as needed to run the service for you and the people in your rooms.
        </p>

        <h2>6. What you must not do</h2>
        <ul>
          <li>Break the law, or help anyone else to, including copyright law and the terms of the websites you watch on.</li>
          <li>Harass, threaten, impersonate or abuse other people, or post hateful, sexual or violent content involving anyone who hasn&apos;t agreed to it.</li>
          <li>Post or link to content that sexually exploits children. We report it to the authorities.</li>
          <li>Send spam or malware, or use rooms to promote scams.</li>
          <li>Try to read private rooms you haven&apos;t been given the passphrase for, access other people&apos;s accounts, or get round rate limits or other security measures.</li>
          <li>Overload, scrape, reverse engineer or interfere with the service, except as the open-source licence of the extension allows (see section 9).</li>
        </ul>

        <h2>7. Reporting problems</h2>
        <p>
          To report a room, a message, a user or a copyright problem, e-mail {mail} with the room name and what is
          wrong. Private-room chat is encrypted with a key we never receive, so we cannot read it. If you report a
          message from a private room, include the text yourself.
        </p>

        <h2>8. Suspension and ending your account</h2>
        <ul>
          <li>
            We may remove rooms, or suspend or close accounts, that break these terms or put other users or the service
            at risk. Where it is reasonable, we will tell you why.
          </li>
          <li>
            You can stop using the service at any time. To have your account deleted, follow the steps in
            the <a href="/privacy">Privacy policy</a>.
          </li>
        </ul>

        <h2>9. Open-source software</h2>
        <p>
          The extension&apos;s source code is published under the MIT licence, which lets you use, change and share the
          code. That licence covers the code. These terms cover your use of the service we run. If you run your own
          copy of the server, these terms don&apos;t apply to it.
        </p>

        <h2>10. Privacy</h2>
        <p>
          How we collect and use your data is described in the <a href="/privacy">Privacy policy</a>.
        </p>

        <h2>11. Changes to the service</h2>
        <p>
          The service is provided free of charge and may change, be interrupted or be discontinued. If we shut it down,
          we will try to give notice on this website first.
        </p>

        <h2>12. No warranty</h2>
        <p>
          The service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind,
          whether express or implied, to the extent the law allows. We don&apos;t promise that it will be
          uninterrupted, error-free or work with every website or video player.
        </p>

        <h2>13. Limits on our liability</h2>
        <p>
          To the extent the law allows, we are not liable for indirect or consequential losses, or for loss of data,
          profits or goodwill, arising from your use of the service. Because the service is free, our total liability
          to you for any claim is limited to 100 US dollars or the equivalent in your currency. Nothing in these terms
          limits liability that cannot be limited by law, or any rights you have as a consumer that cannot be waived.
        </p>

        <h2>14. Changes to these terms</h2>
        <p>
          If we change these terms, we will post the new version here with a new &quot;Last updated&quot; date. For
          significant changes we will also e-mail account holders before they take effect. If you keep using the service after
          a change takes effect, you accept the new terms.
        </p>

        <h2>15. Governing law</h2>
        <p>
          These terms are governed by the laws of <strong>{LEGAL.governingLaw}</strong>. This does not take away any
          protection you have under the consumer laws of the country where you live.
        </p>

        <h2>16. Contact</h2>
        <p>Questions about these terms: {mail}</p>
      </main>
    </>
  );
}
