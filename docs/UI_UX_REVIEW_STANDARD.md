# UI and UX review standard

User direction, 18 September 2026: Review as a real user, screen by screen and process by process. Passing technical checks alone is not evidence that a screen is usable or visually ready.

For every form:

- Question why each field is needed, its order, label, required/optional status, and input control.
- Mark required fields beside their labels; explain errors next to the field and preserve entered data.
- Use searchable choices for categories and country codes. Allow custom business categories where the Core contract supports free text, without modifying the shared catalog.
- Accept natural phone formatting, including spaces and parentheses, and normalize using country-aware dialing rules before sending to Core.
- Explain ambiguous settings such as Accept inquiries in terms of what changes for the user and their clients.
- Group related information, establish a readable hierarchy, use comfortable spacing and touch targets, and check keyboard and small-screen behavior.
- Use supplied design references as inspiration; preserve working data contracts rather than copying reference field content.
- Walk through success, missing/invalid inputs, correction, cancellation, loading, and failures. Inspect rendered screens as well as automated assertions.
- Report precisely which journeys used mocked responses, which used the live backend, and which need physical-device validation. Do not call the whole app ready based on automated checks alone.

Apply this standard to future Presence changes and include it in module handoffs. The business setup screenshots are the reference example for this expectation.
