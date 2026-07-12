export function defaultContractBody(vars: {
  company: string; contractor: string; role: string; rate: string; currency: string
}) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  return `INDEPENDENT CONTRACTOR AGREEMENT

This Independent Contractor Agreement ("Agreement") is entered into as of ${today} between:

CLIENT: ${vars.company} ("Client")
CONTRACTOR: ${vars.contractor} ("Contractor")

1. SERVICES
The Contractor agrees to provide services as ${vars.role}, performing duties as reasonably assigned by the Client.

2. COMPENSATION
The Client shall pay the Contractor at a rate of ${vars.currency} ${vars.rate} per hour, based on timesheets submitted by the Contractor and approved by the Client through the StaffingAtlas platform.

3. INDEPENDENT CONTRACTOR STATUS
The Contractor is an independent contractor and not an employee of the Client. The Contractor is responsible for their own taxes, government contributions, and insurance in their country of residence.

4. CONFIDENTIALITY
The Contractor agrees to keep confidential all non-public information of the Client obtained during the engagement, both during and after the term of this Agreement.

5. INTELLECTUAL PROPERTY
All work product created by the Contractor within the scope of this engagement is the exclusive property of the Client upon payment for the corresponding work.

6. TERM AND TERMINATION
This Agreement begins on the date of signing and continues until terminated by either party with 14 days' written notice. The Client shall pay for all approved hours worked up to the termination date.

7. GOVERNING PLATFORM
Both parties agree to use the StaffingAtlas platform for time tracking, payment summaries, and communications related to this engagement.

By signing below, both parties agree to the terms of this Agreement.`
}
