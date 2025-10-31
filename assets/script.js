// ============================================
// CONFIGURATION
// ============================================
// Centralized timing configuration for all scroll-based animations
// All values are percentages (0-1) of scroll progress through each section

const CONFIG = {
    // Hero section: Main landing section with headline and SVG animations
    hero: {
        textStart: 0,      // When text animation starts (0% scroll)
        textEnd: 0.6,      // When text animation completes (60% scroll)
        svgStart: 0.1,     // When SVG drawing starts (10% scroll)
        svgEnd: 0.95       // When SVG drawing completes (95% scroll)
    },

    // About section: Two-stage animation (headline → body text)
    about: {
        headlineStart: 0,    // Headline starts immediately (0% scroll)
        headlineEnd: 0.3,    // Headline completes (30% scroll)
        textStart: 0.35,     // Body text starts after headline (35% scroll)
        textEnd: 0.6,        // Body text completes (60% scroll)
        svgStart: 0.55,      // SVG animation starts (55% scroll)
        svgEnd: 0.75         // SVG animation completes (95% scroll)
    },

    // Service section: Headline → service items → SVG
    service: {
        headlineStart: 0,      // Headline starts immediately
        headlineEnd: 0.2,      // Headline completes quickly (20% scroll)
        startDelay: 0.25,      // Delay before first service item appears
        itemDelay: 0.15,       // Delay between each service item
        svgStart: 0.05,        // SVG strikethrough starts early
        svgDuration: 0.25      // Duration of SVG animation
    },

    // Partners section: Headline → logo grid
    partners: {
        headlineStart: 0,           // Headline starts immediately
        headlineEnd: 0.3,           // Headline completes (30% scroll)
        triggerOffset: 0.85,        // Logos trigger when 85% in viewport
        animationDuration: 1,       // Duration in seconds for logo fade-in
        svgStart: 0.25,      // SVG animation starts (55% scroll)
        svgEnd: 0.85
    },

    reviews: {
        textStart: 0.1,
        textEnd: 0.35,
        svgStart: 0.35,
        svgEnd: 0.6
    },

    cta: {
        textStart: 0.2,
        textEnd: 0.6,
        svgStart: 0.3,
        svgEnd: 0.65
    },

    // CTA & Reviews sections: Character-by-character text → button fade-in
    fadeInSections: {
        headlineStart: 0.2,   // Headline animation starts early (5% scroll)
        headlineEnd: 0.45,     // Headline completes (35% scroll)
        buttonStart: 0.5,       // Button fades in after headline (40% scroll)
        svgAnimationStart: 0.25,
        svgAnimationEnd: 0.45
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Wraps each character in a text node with <span> tags for character-by-character animation
 * Preserves SVG elements and elements with specific classes
 * @param {HTMLElement} element - The element whose text should be wrapped
 */
function wrapTextInSpans(element) {
    // Classes that should be preserved (not wrapped)
    const preserveClasses = ['has-svg-animated', 'animated-svg'];

    /**
     * Check if a node should be preserved (not processed)
     * @param {Node} node - DOM node to check
     * @returns {boolean} - True if node should be preserved
     */
    function shouldPreserve(node) {
        if (node.nodeType === 1) { // Element node
            return preserveClasses.some(cls => node.classList.contains(cls));
        }
        return false;
    }

    /**
     * Recursively process nodes, wrapping text characters in spans
     * @param {Node} node - Node to process
     * @returns {Node|DocumentFragment} - Processed node or fragment
     */
    function processNode(node) {
        if (node.nodeType === 3) { // Text node
            const text = node.textContent;
            if (text.trim() === '') return node; // Skip empty text nodes

            // Create a document fragment to hold the wrapped characters
            const fragment = document.createDocumentFragment();
            text.split('').forEach(char => {
                if (char === ' ') {
                    // Keep spaces as text nodes (not wrapped)
                    fragment.appendChild(document.createTextNode(' '));
                } else {
                    // Wrap each character in a span for individual animation
                    const span = document.createElement('span');
                    span.textContent = char;
                    fragment.appendChild(span);
                }
            });
            return fragment;
        } else if (node.nodeType === 1) { // Element node
            // Preserve SVG elements completely (don't process children)
            if (node.tagName.toLowerCase() === 'svg' || node.namespaceURI === 'http://www.w3.org/2000/svg') {
                return node.cloneNode(true);
            }

            // Clone element and recursively process its children
            const newNode = node.cloneNode(false);
            Array.from(node.childNodes).forEach(child => {
                const processed = processNode(child);
                newNode.appendChild(processed);
            });
            return newNode;
        }

        // For other node types, just clone
        return node.cloneNode(true);
    }

    // Process the element and replace its content
    const processed = processNode(element);
    element.innerHTML = '';
    Array.from(processed.childNodes).forEach(child => {
        element.appendChild(child);
    });
}



/**
 * Initialize SVG paths for stroke-dasharray animation
 * Sets initial stroke-dashoffset to path length (invisible) and fill opacity to 0
 * @param {NodeList} paths - Collection of SVG path elements
 */
function initializeSvgPaths(paths) {
    paths.forEach(path => {
        try {
            const length = path.getTotalLength();
            if (!isFinite(length) || length <= 0) return;

            // Set up stroke-dasharray animation
            // dasharray = length means the dash is exactly the path length
            // dashoffset = length means the dash is shifted completely off-screen
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
            path.style.fillOpacity = 0; // Start with invisible fill
        } catch (err) {
            console.warn('Invalid path for SVG animation:', path, err);
        }
    });
}

/**
 * Calculate scroll progress through a section (0 to 1)
 * Used for standard sections with 2x viewport height as standard
 * @param {HTMLElement} section - Section element to measure
 * @returns {number} - Progress value between 0 and 1
 */
function calculateProgress(section, viewportHeight = 2) {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const scrollPos = window.scrollY;

    // Progress calculation: normalize scroll position within section
    // Multiply by 2 because sections are 200vh (2x viewport height)
    return Math.max(0, Math.min(1, (scrollPos - sectionTop) / sectionHeight * viewportHeight));
}

/**
 * Calculate scroll progress through a sticky section (0 to 1)
 * Used for sections with sticky content that remains visible while scrolling
 * @param {HTMLElement} section - Sticky section element
 * @returns {number} - Progress value between 0 and 1
 */
function calculateStickyProgress(section) {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const scrollPos = window.scrollY;
    const viewportHeight = window.innerHeight;

    // Calculate the range over which content is sticky
    // progressRange = total scroll distance - viewport height
    const progressRange = sectionHeight - viewportHeight;
    return Math.max(0, Math.min(1, (scrollPos - sectionTop) / progressRange));
}

/**
 * Animate text characters with progressive opacity fade-in
 * Each character fades in sequentially based on scroll progress
 * @param {NodeList} chars - Collection of character span elements
 * @param {number} progress - Animation progress (0 to 1)
 * @param {number} startOpacity - Starting opacity value (default: 0.5)
 */
function animateTextCharacters(chars, progress, startOpacity = 0.5) {
    if (!chars || chars.length === 0) return;

    chars.forEach((char, index) => {
        const totalChars = chars.length;

        // Calculate when this character should start animating
        // Characters are staggered based on their index
        const charDelay = index / totalChars;

        // Each character takes 30% of the total animation time
        const charDuration = 0.3;

        // Calculate this character's individual progress
        let charProgress = (progress - charDelay) / charDuration;
        charProgress = Math.max(0, Math.min(1, charProgress));

        // Interpolate opacity from startOpacity to 1
        char.style.opacity = startOpacity + (charProgress * (1 - startOpacity));
    });
}

/**
 * Animate SVG paths using stroke-dashoffset technique
 * Can animate paths simultaneously or sequentially
 * @param {NodeList} paths - Collection of SVG path elements
 * @param {number} progress - Animation progress (0 to 1)
 * @param {boolean} sequentially - If true, animate paths one after another
 * @param {number} animationDelay - Optional delay between sequential paths
 */
function animateSvgPaths(paths, progress, sequentially = false, animationDelay = null) {
    if (!sequentially) {
        // Animate all paths simultaneously
        paths.forEach(path => {
            const length = path.getTotalLength();

            // Reduce dashoffset as progress increases (reveals the stroke)
            const offset = length - (length * progress);
            path.style.strokeDashoffset = offset;

            // Animate fill opacity after stroke is 30% complete
            const fillProgress = Math.max(0, (progress - 0.3) / 0.7);
            path.style.fillOpacity = fillProgress;
        });
    } else {
        // Animate paths sequentially (one after another)
        if (!animationDelay) animationDelay = 1 / paths.length;

        paths.forEach((path, index) => {
            const length = path.getTotalLength();

            // Calculate timing for this specific path
            const pathStart = index * animationDelay;
            const pathEnd = pathStart + animationDelay;

            // Calculate progress for this individual path
            let pathProgress = (progress - pathStart) / (pathEnd - pathStart);
            pathProgress = Math.max(0, Math.min(1, pathProgress));

            // Animate stroke
            path.style.strokeDashoffset = length - (length * pathProgress);

            // Animate fill opacity after stroke is 40% complete
            const fillProgress = Math.max(0, (pathProgress - 0.4) / 0.6);
            path.style.fillOpacity = fillProgress;
        });
    }
}

/**
 * Reset SVG paths to initial state (invisible)
 * @param {NodeList} paths - Collection of SVG path elements
 */
function resetSvgPaths(paths) {
    paths.forEach(path => {
        const length = path.getTotalLength();
        path.style.strokeDashoffset = length; // Hide stroke
        path.style.fillOpacity = 0;           // Hide fill
    });
}

/**
 * Check if an element is within the viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} offset - Viewport offset (0 to 1, default: 0.85)
 * @returns {boolean} - True if element is in viewport
 */
function isInViewport(element, offset = 0.85) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    // Check if element is between top of screen and offset point
    return rect.top <= windowHeight * offset && rect.bottom >= 0;
}

// ============================================
// INITIALIZATION
// ============================================



// Cache DOM elements for better performance (avoid repeated querySelector calls)
const sections = {
    hero: document.getElementById('heroSection'),
    about: document.getElementById('aboutSection'),
    service: document.querySelector('.service-section'),
    partners: document.getElementById('partnersSection'),
    publications: document.getElementById('publicationsSection'),
    reviews: document.getElementById('reviewsSection'),
    cta: document.getElementById('ctaSection')
};

// Initialize text wrapping for all sub-headlines to enable character animation
const allSubHeadlines = document.querySelectorAll('.sub-headline');
allSubHeadlines.forEach(headline => wrapTextInSpans(headline));

// ============================================
// HERO SECTION
// ============================================
// Main landing section with large headline and multiple SVG underlines

const heroText = document.getElementById("heroHeadline");
if (heroText) wrapTextInSpans(heroText);

// Get all character spans (excluding SVG containers)
const heroChars = heroText?.querySelectorAll('span:not(.has-svg-animated)') || [];

// Get all SVG paths that need animation
const heroPaths = heroText.querySelectorAll('.has-svg-animated svg path, .has-svg-animated svg line');
initializeSvgPaths(heroPaths);
console.log("initialized hero paths");
console.log(heroPaths);
/**
 * Animate hero section based on scroll progress
 * Stage 1: Text characters fade in (0-60%)
 * Stage 2: SVG paths draw in sequentially (10-95%)
 */
function animateHero() {
    if (!sections.hero) return;

    const progress = calculateProgress(sections.hero);

    // Stage 1: Animate text characters
    if (progress <= CONFIG.hero.textEnd) {
        const textProgress = (progress - CONFIG.hero.textStart) / (CONFIG.hero.textEnd - CONFIG.hero.textStart);
        animateTextCharacters(heroChars, textProgress);
    } else {
        // Ensure all characters are at full opacity after animation completes
        heroChars.forEach(char => char.style.opacity = 1);
    }

    // Stage 2: Animate SVG paths
    if (progress > CONFIG.hero.svgStart && progress <= CONFIG.hero.svgEnd) {
        const svgProgress = (progress - CONFIG.hero.svgStart) / (CONFIG.hero.svgEnd - CONFIG.hero.svgStart);
        animateSvgPaths(heroPaths, svgProgress, true); // true = sequential animation
    } else if (progress <= CONFIG.hero.svgStart) {
        // Reset SVGs if user scrolls back up
        resetSvgPaths(heroPaths);
    }
}

// ============================================
// ABOUT SECTION
// ============================================
// "About me" section with headline, body text, and image

const aboutText = document.querySelector("#aboutContent .text-content");
const aboutHeadlineChars = document.querySelectorAll('#aboutHeader span:not(.has-svg-animated)');

if (aboutText) wrapTextInSpans(aboutText);

const aboutChars = aboutText?.querySelectorAll('span:not(.has-svg-animated)') || [];
const aboutPaths = sections.about.querySelectorAll('#aboutSection .has-svg-animated svg path, #aboutSection .has-svg-animated svg line');
initializeSvgPaths(aboutPaths);

/**
 * Animate about section with three stages:
 * Stage 1: Headline animates (0-30%)
 * Stage 2: Body text animates (35-60%)
 * Stage 3: SVG decorations animate (55-95%)
 */
function animateAbout() {
    if (!sections.about) return;

    const progress = calculateProgress(sections.about);

    // Stage 1: Animate headline first
    if (aboutHeadlineChars.length > 0) {
        if (progress <= CONFIG.about.headlineEnd) {
            const textProgress = (progress - CONFIG.about.headlineStart) / (CONFIG.about.headlineEnd - CONFIG.about.headlineStart);
            animateTextCharacters(aboutHeadlineChars, textProgress);
        } else {
            aboutHeadlineChars.forEach(char => char.style.opacity = 1);
        }
    }

    // Stage 2: Animate body text after headline
    if (progress >= CONFIG.about.textStart) {
        if (progress <= CONFIG.about.textEnd) {
            const textProgress = (progress - CONFIG.about.textStart) / (CONFIG.about.textEnd - CONFIG.about.textStart);
            animateTextCharacters(aboutChars, textProgress);
        } else {
            aboutChars.forEach(char => char.style.opacity = 1);
        }
    }

    // Stage 3: Animate SVG decorations
    if (aboutPaths.length > 0) {
        if (progress > CONFIG.about.svgStart && progress <= CONFIG.about.svgEnd) {
            const svgProgress = (progress - CONFIG.about.svgStart) / (CONFIG.about.svgEnd - CONFIG.about.svgStart);
            animateSvgPaths(aboutPaths, svgProgress, true);
        } else if (progress <= CONFIG.about.svgStart) {
            resetSvgPaths(aboutPaths);
        }
    }
}

// ============================================
// SERVICE SECTION
// ============================================
// "What I do" section with crossed-out text and service list

const serviceHeaderChars = document.querySelectorAll('#serviceHeader span:not(.has-svg-animated)');
const serviceItems = document.querySelectorAll('.service-list li');
const serviceSvgPaths = document.querySelectorAll('.service-section .animated-path');

// Set initial state for service header
serviceHeaderChars.forEach(char => {
    char.style.opacity = 0.5; // Match startOpacity in animateTextCharacters
});

// Set initial state for service items (off-screen below)
serviceItems.forEach(item => {
    item.style.transform = 'translateY(150px)';
    item.style.opacity = '0';
    item.style.willChange = 'transform, opacity'; // Performance hint for browser
});

initializeSvgPaths(serviceSvgPaths);

/**
 * Animate service section with multiple stages:
 * Stage 1: Headline fades in (0-20%)
 * Stage 2: Service items slide up sequentially (25%+)
 * Stage 3: SVG strikethrough animates (5-30%)
 */
function animateServiceSection() {
    if (!sections.service) return;

    const sectionTop = sections.service.offsetTop;
    const scrollPos = window.scrollY;

    // Reset animations if user scrolls above section
    if (scrollPos < sectionTop) {
        serviceItems.forEach(item => {
            item.style.transform = 'translateY(150px)';
            item.style.opacity = '0';
        });
        resetSvgPaths(serviceSvgPaths);
        return;
    }

    const progress = calculateStickyProgress(sections.service);

    // Stage 1: Animate headline first
    if (serviceHeaderChars.length > 0) {
        if (progress <= CONFIG.service.headlineEnd) {
            const textProgress = (progress - CONFIG.service.headlineStart) / (CONFIG.service.headlineEnd - CONFIG.service.headlineStart);
            animateTextCharacters(serviceHeaderChars, textProgress);
        } else {
            serviceHeaderChars.forEach(char => char.style.opacity = 1);
        }
    }

    // Stage 2: Animate service items sequentially
    serviceItems.forEach((item, index) => {
        // Calculate when this item should start animating
        const itemStart = CONFIG.service.startDelay + (index * CONFIG.service.itemDelay);

        if (progress >= itemStart) {
            // Calculate progress for this specific item
            const itemProgress = Math.min(1, (progress - itemStart) / CONFIG.service.itemDelay);

            // Apply easing for smooth deceleration
            const eased = 1 - Math.pow(1 - itemProgress, 3); // Cubic ease-out

            // Animate position and opacity
            item.style.transform = `translateY(${150 - (eased * 150)}px)`;
            item.style.opacity = eased;
        } else {
            // Keep item in initial state if it hasn't started yet
            item.style.transform = 'translateY(150px)';
            item.style.opacity = '0';
        }
    });

    // Stage 3: Animate SVG strikethrough
    if (serviceSvgPaths.length > 0) {
        if (progress >= CONFIG.service.svgStart) {
            const svgProgress = Math.min(1, (progress - CONFIG.service.svgStart) / CONFIG.service.svgDuration);
            animateSvgPaths(serviceSvgPaths, svgProgress);
        } else {
            resetSvgPaths(serviceSvgPaths);
        }
    }
}

// ============================================
// PARTNERS SECTION
// ============================================
// Grid of partner/client logos with fade-in animation

const partnersHeaderChars = document.querySelectorAll('#partnersHeader span:not(.has-svg-animated)');
const partnerItems = document.querySelectorAll('.partners-table img');
const partnerSvgPaths = document.querySelectorAll('#partnersSection svg line, #partnersSection svg path');
initializeSvgPaths(partnerSvgPaths);

// Set initial state for partner logos
partnerItems.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(80px)';
    item.style.transition = `opacity ${CONFIG.partners.animationDuration}s ease-out, transform ${CONFIG.partners.animationDuration}s ease-out`;
    item.dataset.animated = 'false'; // Track animation state
});

/**
 * Animate partners section:
 * Stage 1: Headline fades in (0-30%)
 * Stage 2: Logos fade in when they enter viewport (85% threshold)
 */
function animatePartners() {
    if (!sections.partners) return;

    const progress = calculateStickyProgress(sections.partners);

    // Stage 1: Animate headline
    if (partnersHeaderChars.length > 0) {
        if (progress <= CONFIG.partners.headlineEnd) {
            const textProgress = (progress - CONFIG.partners.headlineStart) / (CONFIG.partners.headlineEnd - CONFIG.partners.headlineStart);
            animateTextCharacters(partnersHeaderChars, textProgress);
        } else {
            partnersHeaderChars.forEach(char => char.style.opacity = 1);
        }
    }

    // Stage 2: Animate partner logos when they enter viewport
    if (partnerItems.length === 0) return;

    partnerItems.forEach(item => {
        // Skip if already animated (prevent re-triggering)
        if (item.dataset.animated === 'true') return;

        // Check if logo is in viewport
        if (isInViewport(item, CONFIG.partners.triggerOffset)) {
            item.dataset.animated = 'true';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }
    });

    // Stage 3: Animate SVGs
    if (partnerSvgPaths.length > 0) {
        if (progress >= CONFIG.service.svgStart) {
            const svgProgress = Math.min(1, (progress - CONFIG.service.svgStart) / CONFIG.service.svgDuration);
            animateSvgPaths(partnerSvgPaths, svgProgress);
        } else {
            resetSvgPaths(partnerSvgPaths);
        }
    }

}

// ============================================
// PUBLICATIONS SECTION
// ============================================
// Scrollable list of publications with sticky headers and image switching

const publicationItems = document.querySelectorAll('.publication');
const publicationImages = document.querySelectorAll('.publication-image');
const isMobile = window.innerWidth <= 1024;

// Wrap publication text content and store character references
publicationItems.forEach(item => {
    const textContent = item.querySelector('p');
    if (textContent) {
        wrapTextInSpans(textContent);
        const chars = textContent.querySelectorAll('span:not(.has-svg-animated)');
        item.dataset.textChars = 'wrapped';
        item.textChars = chars; // Store reference for animation

        // Set initial opacity (subtle baseline)
        chars.forEach(char => {
            char.style.opacity = 0.3;
        });
    }
});

/**
 * Animate publications section:
 * - Text fades in as publication enters viewport (30-70%)
 * - Images switch based on which publication is closest to center
 * - Headers become sticky while their content is visible
 */
function animatePublications() {
    if (!sections.publications || publicationItems.length === 0) return;

    const viewportCenter = window.innerHeight / 2;
    const viewportTop = window.innerHeight * 0.3;    // 30% from top
    const viewportBottom = window.innerHeight * 0.7;  // 70% from top
    let activePublication = null;
    let closestDistance = Infinity;

    publicationItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + (rect.height / 2);
        const distance = Math.abs(itemCenter - viewportCenter);

        // Animate text content based on viewport position
        if (item.textChars) {
            // Text animates when between 30% and 70% of viewport
            if (rect.top < viewportBottom && rect.bottom > viewportTop) {
                let textProgress = 0;

                const itemTop = rect.top;
                const entryPoint = viewportBottom;   // Start at 70%
                const completePoint = viewportTop;   // Complete at 30%

                if (itemTop <= completePoint) {
                    // Item has reached completion point - full opacity
                    textProgress = 1;
                } else if (itemTop < entryPoint) {
                    // Item is between entry and complete - animate
                    const range = entryPoint - completePoint;
                    const currentPos = itemTop - completePoint;
                    textProgress = 1 - (currentPos / range);
                    textProgress = Math.max(0, Math.min(1, textProgress));
                } else {
                    // Item hasn't entered yet
                    textProgress = 0;
                }

                // Apply animation
                if (textProgress >= 1) {
                    // Explicitly set full opacity when animation completes
                    item.textChars.forEach(char => {
                        char.style.opacity = 1;
                    });
                } else {
                    animateTextCharacters(item.textChars, textProgress, 0.3);
                }
            } else if (rect.bottom <= viewportTop) {
                // Item is above viewport - keep at full opacity
                item.textChars.forEach(char => {
                    char.style.opacity = 1;
                });
            } else {
                // Item is below viewport - reset to low opacity
                item.textChars.forEach(char => {
                    char.style.opacity = 0.3;
                });
            }
        }

        // Mobile: simpler logic - just track closest publication
        if (isMobile) {
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                if (distance < closestDistance) {
                    closestDistance = distance;
                    activePublication = item.dataset.publication;
                }
            }
        } else {
            // Desktop: implement sticky header behavior
            const header = item.querySelector('.publication-sticky-header');
            const textContent = item.querySelector('p');

            if (header && textContent) {
                const textRect = textContent.getBoundingClientRect();

                // Check if 25% of text content is still visible
                const textVisible = textRect.bottom - textRect.height * 0.25;

                // Make header sticky while text is visible
                if (textRect.top <= 20 && textVisible > 0) {
                    header.style.position = 'sticky';
                } else if (textVisible <= 0) {
                    header.style.position = 'relative';
                }
            }

            // Track which publication is in center zone for image switching
            if (rect.top < viewportBottom && rect.bottom > viewportTop) {
                item.classList.add('in-view');
            } else {
                item.classList.remove('in-view');
            }

            // Track closest publication to viewport center
            if (distance < closestDistance && rect.top < window.innerHeight && rect.bottom > 0) {
                closestDistance = distance;
                activePublication = item.dataset.publication;
            }
        }
    });

    // Switch active image based on which publication is closest to center
    if (activePublication && publicationImages.length > 0) {
        publicationImages.forEach(img => {
            if (img.dataset.publication === activePublication) {
                img.classList.add('active');
            } else {
                img.classList.remove('active');
            }
        });
    }
}

// ============================================
// REVIEWS SECTION
// ============================================

const reviewsHeadline = sections.reviews.querySelector('#reviewsHeadline');
const reviewsButton = sections.reviews.querySelector('#reviewsButton');
wrapTextInSpans(reviewsButton);
wrapTextInSpans(reviewsHeadline);

const reviewsChars = sections.reviews.querySelectorAll('span:not(.has-svg-animated)');

const reviewsSvgPaths = sections.reviews.querySelectorAll('.has-svg-animated svg line, .has-svg-animated svg path');
initializeSvgPaths(reviewsSvgPaths);

function animateReviewsSection() {
    if (!sections.reviews) return;

    const progress = calculateStickyProgress(sections.reviews);

    // Stage 1: Animate headline
    if (reviewsChars.length > 0) {
        if (progress <= CONFIG.reviews.textEnd) {
            const textProgress = (progress - CONFIG.reviews.textStart) / (CONFIG.reviews.textEnd - CONFIG.reviews.textStart);
            animateTextCharacters(reviewsChars, textProgress, 0);
        } else {
            reviewsChars.forEach(char => char.style.opacity = 1);
        }
    }

    // Stage 2: Animate SVGs
    if (reviewsSvgPaths.length > 0) {
        if (progress >= CONFIG.reviews.svgStart) {
            const svgProgress = Math.min(1, (progress - CONFIG.reviews.svgStart) / CONFIG.reviews.svgEnd);
            animateSvgPaths(reviewsSvgPaths, svgProgress, true);
        } else {
            resetSvgPaths(reviewsSvgPaths);
        }
    }
};
// ============================================
// CTA SECTION
// ============================================

const ctaHeadline = sections.cta.querySelector('#ctaHeadline');
const ctaButton = sections.cta.querySelector('#ctaButton');
wrapTextInSpans(ctaButton);
wrapTextInSpans(ctaHeadline);

const ctaChars = sections.cta.querySelectorAll('span:not(.has-svg-animated)');

const ctaSvgPaths = sections.cta.querySelectorAll('.has-svg-animated svg line, .has-svg-animated svg path');
initializeSvgPaths(ctaSvgPaths);

function animateCtaSection() {
    if (!sections.cta) return;

    const progress = calculateStickyProgress(sections.cta);

    // Stage 1: Animate headline
    if (ctaChars.length > 0) {
        if (progress <= CONFIG.cta.textEnd) {
            const textProgress = (progress - CONFIG.cta.textStart) / (CONFIG.cta.textEnd - CONFIG.cta.textStart);
            animateTextCharacters(ctaChars, textProgress, 0);
        } else {
            ctaChars.forEach(char => char.style.opacity = 1);
        }
    }

    // Stage 2: Animate SVGs
    if (ctaSvgPaths.length > 0) {
        if (progress >= CONFIG.cta.svgStart) {
            const svgProgress = Math.min(1, (progress - CONFIG.cta.svgStart) / CONFIG.cta.svgEnd);
            animateSvgPaths(ctaSvgPaths, svgProgress, true);
        } else {
            resetSvgPaths(ctaSvgPaths);
        }
    }
};



// ============================================
// SCROLL HANDLER
// ============================================

let ticking = false;

function handleScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            animateHero();
            animateAbout();
            animateServiceSection();
            animatePartners();
            animatePublications();
            animateReviewsSection();
            animateCtaSection();
            ticking = false;
        });
        ticking = true;
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

window.addEventListener('scroll', handleScroll, { passive: true });

// Handle window resize for responsive behavior
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        location.reload(); // Reload on significant resize to recalculate
    }, 250);
}, { passive: true });

// Initial call
handleScroll();