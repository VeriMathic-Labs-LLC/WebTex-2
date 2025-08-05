// Domain utility functions for WebTeX

// Common subdomains to strip when normalizing domains
const COMMON_SUBDOMAINS = [
	"www",
	"m",
	"mobile",
	"app",
	"api",
	"cdn",
	"static",
	"assets",
	"media",
	"img",
	"images",
	"js",
	"css",
	"fonts",
	"blog",
	"forum",
	"support",
	"help",
	"docs",
	"dev",
	"staging",
	"test",
	"beta",
	"alpha",
];

/**
 * Normalize a domain by stripping common subdomains
 * @param {string} hostname - The hostname to normalize
 * @returns {string} The normalized domain
 */
export function normalizeDomain(hostname) {
	if (!hostname) return "";

	// Handle localhost and IP addresses
	if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
		return hostname;
	}

	// Split into parts
	const parts = hostname.split(".");

	// If we have 2 or fewer parts, return as-is
	if (parts.length <= 2) {
		return hostname;
	}

	// Check if the first part is a common subdomain
	const firstPart = parts[0].toLowerCase();
	if (COMMON_SUBDOMAINS.includes(firstPart)) {
		// Remove the common subdomain
		return parts.slice(1).join(".");
	}

	// For domains with more than 2 parts, check if it's a country-specific domain
	// e.g., example.co.uk, example.com.au
	if (parts.length > 2) {
		const tld = parts[parts.length - 1];

		// Common country-specific TLDs that should keep the second-to-last part
		const countryTlds = [
			"uk",
			"au",
			"nz",
			"za",
			"br",
			"in",
			"jp",
			"kr",
			"cn",
			"ru",
			"de",
			"fr",
			"it",
			"es",
			"nl",
			"se",
			"no",
			"dk",
			"fi",
			"pl",
			"cz",
			"hu",
			"ro",
			"bg",
			"hr",
			"si",
			"sk",
			"ee",
			"lv",
			"lt",
			"mt",
			"cy",
			"gr",
			"pt",
			"ie",
			"be",
			"at",
			"ch",
			"lu",
			"li",
			"mc",
			"ad",
			"sm",
			"va",
		];

		if (countryTlds.includes(tld)) {
			// For country domains, keep the last 3 parts (e.g., example.co.uk)
			return parts.slice(-3).join(".");
		}
	}

	// Default: keep the last 2 parts (domain.tld)
	return parts.slice(-2).join(".");
}

/**
 * Check if a hostname matches a normalized domain
 * @param {string} hostname - The hostname to check
 * @param {string} normalizedDomain - The normalized domain to match against
 * @returns {boolean} True if the hostname matches the domain
 */
export function domainMatches(hostname, normalizedDomain) {
	if (!hostname || !normalizedDomain) return false;

	// Handle exact matches
	if (hostname === normalizedDomain) return true;

	// Handle localhost and IP addresses
	if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
		return hostname === normalizedDomain;
	}

	// Check if the hostname ends with the normalized domain
	// This handles subdomains like www.example.com matching example.com
	// But we need to be careful about exact matches to avoid false positives
	if (hostname === normalizedDomain) {
		return true;
	}

	// Check if it's a subdomain (must end with .domain)
	return hostname.endsWith(`.${normalizedDomain}`);
}

/**
 * Get the display name for a domain (for UI purposes)
 * @param {string} hostname - The hostname to get display name for
 * @returns {string} The display name
 */
export function getDomainDisplayName(hostname) {
	const normalized = normalizeDomain(hostname);

	// If the normalized domain is the same as the hostname, show as-is
	if (normalized === hostname) {
		return hostname;
	}

	// Otherwise, show the normalized domain with a note about subdomains
	return `${normalized} (and subdomains)`;
}

/**
 * Get all domains that would be affected by enabling/disabling a domain
 * @param {string} hostname - The hostname to check
 * @param {Array<string>} existingDomains - List of existing allowed domains
 * @returns {Array<string>} List of domains that would be affected
 */
export function getAffectedDomains(hostname, existingDomains = []) {
	const normalized = normalizeDomain(hostname);
	const affected = [];

	// Check existing domains to see which ones would be covered
	for (const domain of existingDomains) {
		if (domainMatches(domain, normalized)) {
			affected.push(domain);
		}
	}

	// Add the current hostname if it's not already in the list
	if (!affected.includes(hostname)) {
		affected.push(hostname);
	}

	return affected;
}

/**
 * Check if a domain is already covered by existing allowed domains
 * @param {string} hostname - The hostname to check
 * @param {Array<string>} allowedDomains - List of allowed domains
 * @returns {boolean} True if the domain is already covered
 */
export function isDomainCovered(hostname, allowedDomains) {
	return allowedDomains.some((domain) => domainMatches(hostname, domain));
}
