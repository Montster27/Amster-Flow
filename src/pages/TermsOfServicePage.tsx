import { Link } from 'react-router-dom';

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/signup" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to Sign Up
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">AmsterFlow – Terms of Service & Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last Updated: November 14, 2025</p>
        </div>

        {/* Content */}
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-6">
            AmsterFlow is a platform designed to help individuals, students, and teams evaluate early-stage business ideas through structured reflection, customer discovery, and project development tools. By using AmsterFlow, you agree to the following Terms of Service and Privacy Policy.
          </p>
          <p className="text-gray-700 mb-6">
            This document applies to all users participating through <strong>universities</strong>, <strong>accelerators</strong>, <strong>incubators</strong>, <strong>learning programs</strong>, and similar educational or early-stage innovation settings.
          </p>

          <hr className="my-8" />

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Purpose of the Platform</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>AmsterFlow supports learning, project development, and early-stage business validation.</li>
            <li>The platform provides tools, templates, and suggestions based on your input.</li>
            <li>AmsterFlow is <strong>not</strong> a substitute for professional financial, legal, or business advice.</li>
            <li>The platform may be used in settings that are both <strong>educational</strong> and <strong>semi-commercial</strong>, including partner accelerators.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Eligibility & Access</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>You must be part of a participating program (university course, accelerator cohort, or similar initiative).</li>
            <li>Access may be provided by your program administrators or directly through the platform.</li>
            <li>You are responsible for maintaining your login credentials and ensuring the accuracy of the content you enter.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Acceptable Use</h2>
          <p className="text-gray-700 mb-2">By using AmsterFlow, you agree that you will:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Use the platform only for legitimate project development, customer discovery, and learning activities.</li>
            <li>Not upload harmful, illegal, offensive, or copyrighted content unless you have the rights to use it.</li>
            <li>Not attempt to hack, disrupt, or misuse the system in any way.</li>
            <li>Not use the platform to harass other participants or share sensitive information without consent.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Ownership of Content</h2>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Your Content</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>You retain ownership of all content you create, including assumptions, interview notes, reflections, files, and project data.</li>
            <li>AmsterFlow requires a license to store, process, and display your content to operate the platform.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Program Access</h3>
          <p className="text-gray-700 mb-2">In university or accelerator contexts:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Program staff (educators, managers) may access your project data to support learning, evaluate progress, or administer the program.</li>
            <li>Programs <strong>do not</strong> receive ownership of your intellectual property unless governed by a separate agreement.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Platform Use of Content</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>AmsterFlow may use anonymized, aggregated data to improve the system and generate educational insights.</li>
            <li>Your individual project content will never be sold or commercially exploited by the platform.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. License to Partner Programs</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Partner organizations (universities, accelerators) receive a limited, non-exclusive license to use the platform with their cohorts.</li>
            <li>Programs may not resell or sublicense access to the system without permission.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Platform Reliability & Disclaimer</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>AmsterFlow is provided <strong>"as is"</strong>, without guarantees of uninterrupted service or error-free functionality.</li>
            <li>While the platform helps structure your thinking, <strong>you are responsible for your own project and business decisions</strong>.</li>
            <li>The creators of AmsterFlow are not liable for business outcomes, financial losses, or missed opportunities resulting from the use of the tool.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Termination & Suspension</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Access may be suspended for violating these terms or disrupting the platform.</li>
            <li>Program administrators may revoke access if your participation in their program ends.</li>
            <li>You may stop using the platform at any time.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Data We Collect</h2>
          <p className="text-gray-700 mb-2">AmsterFlow collects the following categories of information:</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">A. Data You Provide</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Project data, assumptions, interview notes, reflections, uploaded files.</li>
            <li>Optional profile information (name, email, team, cohort).</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">B. Program Information</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Your cohort, team structure, and associated program (if using via a partner).</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">C. Technical Data</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Browser type, device type, usage statistics, approximate location, and session logs.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">D. Local Storage</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Autosave features may store content in your browser.</li>
          </ul>

          <p className="text-gray-700 mt-4">We do <strong>not</strong> collect unnecessary personal data.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. How Your Data Is Used</h2>
          <p className="text-gray-700 mb-2">Your data is used to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Operate the platform's features and save your work.</li>
            <li>Generate recommendations and analytics inside your project dashboard.</li>
            <li>Allow program staff to support your learning or progress.</li>
            <li>Improve platform performance and tools.</li>
            <li>Produce anonymized insights or research for improving entrepreneurial education.</li>
          </ul>
          <p className="text-gray-700 mt-4">Your data is <strong>not used</strong> for advertising, profiling, or commercial marketing.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Who Can Access Your Data</h2>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">A. You</h3>
          <p className="text-gray-700">You can view, edit, export, or delete your own project data (subject to program requirements).</p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">B. Program Staff</h3>
          <p className="text-gray-700 mb-2">Program instructors or accelerator managers may access your project content <strong>only</strong> for:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Educational support</li>
            <li>Progress evaluation</li>
            <li>Program administration</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">C. Platform Administrators</h3>
          <p className="text-gray-700 mb-2">Limited access for:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Technical support</li>
            <li>System maintenance</li>
            <li>Data integrity and security</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">D. Third Parties</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Only infrastructure providers (e.g., cloud hosting, email systems), who must comply with strict privacy obligations.</li>
            <li>No selling or sharing of data with advertisers.</li>
            <li>No third-party access for commercial exploitation.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">E. Legal Requirements</h3>
          <p className="text-gray-700">Data may be disclosed if required by law or lawful government request.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Storage & Security</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>AmsterFlow implements industry-standard security controls appropriate for a modern cloud-based learning and project development platform. Our current security program includes secure transmission (HTTPS), strong authentication, role-based access control, input sanitization, encrypted storage managed by our hosting provider, regular dependency patching, server hardening, and audit logging for key events. Access to production environments is restricted to authorized personnel under the principle of least privilege.</li>
            <li>While we cannot guarantee absolute security, we maintain a reasonable and continuously improving security posture designed to protect user data from unauthorized access or disclosure.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Data Retention</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Data is retained for the duration of your program and for a reasonable period afterward.</li>
            <li>You may request deletion of your project data unless program rules require temporary retention (e.g., grading, compliance).</li>
          </ul>
          <p className="text-gray-700 mt-4">Aggregated anonymized data may be kept indefinitely.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Cookies & Local Storage</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Local storage may be used to autosave your progress.</li>
            <li>Essential cookies may be used for login/session management.</li>
            <li>No advertising or tracking cookies are used.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Your Rights</h2>
          <p className="text-gray-700 mb-2">Depending on your jurisdiction, you may have rights including:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Access to your data</li>
            <li>Correction of inaccurate data</li>
            <li>Deletion of your project content</li>
            <li>Export of your work</li>
            <li>Request limitations on data use</li>
            <li>Withdraw consent (where applicable)</li>
          </ul>
          <p className="text-gray-700 mt-4">To exercise rights, contact the platform administrator or your program.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">15. Third-Party Links</h2>
          <p className="text-gray-700">
            The platform may link to external resources (e.g., startup guides, templates).
            We are not responsible for the content or privacy practices of third-party sites.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">16. Changes to This Document</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>This combined Terms of Service & Privacy Policy may be updated periodically.</li>
            <li>Continued use of AmsterFlow means acceptance of updated terms.</li>
            <li>If changes are significant, users may be notified within the platform.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">17. Contact</h2>
          <p className="text-gray-700">
            For questions about these terms, privacy practices, or data requests:<br />
            <a href="mailto:montys@mit.edu" className="text-blue-600 hover:text-blue-700 font-medium">
              montys@mit.edu
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            to="/signup"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
