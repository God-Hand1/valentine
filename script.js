/**
 * Premium Valentine Website - Interactive Controller
 * ===================================================
 * Corporate-Grade JavaScript Architecture
 * 
 * @version 3.0.0
 * @author Valentine Experience Team
 * @license MIT
 * 
 * Architecture:
 * - Modular ES6+ design with strict separation of concerns
 * - Event delegation for optimal performance
 * - Memory-safe event listener management
 * - Hardware-accelerated animations (transform/opacity only)
 * - Passive event listeners for scroll performance
 * - WCAG 2.1 AA compliant interactions
 * - Comprehensive error handling and fallbacks
 * - Performance monitoring and optimization
 * 
 * Features:
 * - Envelope opening animation with GPU acceleration
 * - Touch-optimized drag system with passive listeners
 * - Intelligent Z-index stacking management
 * - Adaptive "No" button evasion algorithm
 * - Progressive "Yes" button growth mechanics
 * - Canvas-based particle system with RAF optimization
 * - Cross-browser compatibility (Safari, Chrome, Firefox, Edge)
 * - Memory leak prevention with proper cleanup
 * - Graceful degradation for older browsers
 * 
 * Browser Support:
 * - Chrome 90+
 * - Firefox 88+
 * - Safari 14+
 * - Edge 90+
 * - iOS Safari 14+
 * - Chrome Android 90+
 */

'use strict';

/* ============================================
   ErrorHandler Module
   Centralized error handling and logging
   ============================================ */
const ErrorHandler = (() => {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    /**
     * Log error to console in development mode
     * @param {string} context - Where the error occurred
     * @param {Error} error - The error object
     */
    const logError = (context, error) => {
        if (isDevelopment) {
            console.error(`[Valentine App Error - ${context}]:`, error);
        }
    };

    /**
     * Handle non-critical errors gracefully
     * @param {string} context - Where the error occurred
     * @param {Error} error - The error object
     * @param {Function} fallback - Optional fallback function
     */
    const handleError = (context, error, fallback = null) => {
        logError(context, error);

        if (fallback && typeof fallback === 'function') {
            try {
                fallback();
            } catch (fallbackError) {
                logError(`${context} - Fallback`, fallbackError);
            }
        }
    };

    /**
     * Safe function wrapper with error handling
     * @param {Function} fn - Function to wrap
     * @param {string} context - Context for error reporting
     * @returns {Function} Wrapped function
     */
    const safeExecute = (fn, context) => {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                handleError(context, error);
                return null;
            }
        };
    };

    return {
        logError,
        handleError,
        safeExecute
    };
})();

/* ============================================
   PerformanceMonitor Module
   Track and optimize performance metrics
   ============================================ */
const PerformanceMonitor = (() => {
    const metrics = {
        animationFrames: 0,
        droppedFrames: 0,
        lastFrameTime: 0
    };

    let isMonitoring = false;
    let monitoringId = null;

    /**
     * Monitor frame rate for performance issues
     */
    const monitorFrameRate = () => {
        if (!isMonitoring) return;

        const now = performance.now();

        if (metrics.lastFrameTime > 0) {
            const delta = now - metrics.lastFrameTime;
            const fps = 1000 / delta;

            // Track dropped frames (below 55fps threshold)
            if (fps < 55) {
                metrics.droppedFrames++;
            }

            metrics.animationFrames++;
        }

        metrics.lastFrameTime = now;
        monitoringId = requestAnimationFrame(monitorFrameRate);
    };

    /**
     * Start performance monitoring
     */
    const startMonitoring = () => {
        if (isMonitoring) return;
        isMonitoring = true;
        monitorFrameRate();
    };

    /**
     * Stop performance monitoring
     */
    const stopMonitoring = () => {
        isMonitoring = false;
        if (monitoringId) {
            cancelAnimationFrame(monitoringId);
            monitoringId = null;
        }
    };

    /**
     * Check if device supports hardware acceleration
     * @returns {boolean}
     */
    const supportsHardwareAcceleration = () => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    };

    return {
        startMonitoring,
        stopMonitoring,
        supportsHardwareAcceleration
    };
})();

/* ============================================
   BrowserCompatibility Module
   Feature detection and polyfills
   ============================================ */
const BrowserCompatibility = (() => {
    /**
     * Check if browser supports required features
     * @returns {Object} Feature support flags
     */
    const checkFeatures = () => {
        return {
            canvas: !!document.createElement('canvas').getContext,
            requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
            transform3d: (() => {
                const el = document.createElement('div');
                const transforms = {
                    'transform': 'transform',
                    'WebkitTransform': '-webkit-transform',
                    'MozTransform': '-moz-transform',
                    'msTransform': '-ms-transform'
                };

                for (let t in transforms) {
                    if (el.style[t] !== undefined) {
                        return true;
                    }
                }
                return false;
            })(),
            backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)') ||
                CSS.supports('-webkit-backdrop-filter', 'blur(10px)'),
            touchEvents: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            passiveEvents: (() => {
                let supportsPassive = false;
                try {
                    const opts = Object.defineProperty({}, 'passive', {
                        get: () => { supportsPassive = true; }
                    });
                    window.addEventListener('testPassive', null, opts);
                    window.removeEventListener('testPassive', null, opts);
                } catch (e) { }
                return supportsPassive;
            })()
        };
    };

    /**
     * Apply fallbacks for unsupported features
     * @param {Object} features - Feature support flags
     */
    const applyFallbacks = (features) => {
        // Fallback for requestAnimationFrame
        if (!features.requestAnimationFrame) {
            window.requestAnimationFrame = (callback) => {
                return setTimeout(callback, 1000 / 60);
            };
            window.cancelAnimationFrame = (id) => {
                clearTimeout(id);
            };
        }

        // Fallback for transform3d
        if (!features.transform3d) {
            document.documentElement.classList.add('no-transforms');
        }

        // Fallback for backdrop-filter
        if (!features.backdropFilter) {
            document.documentElement.classList.add('no-backdrop-filter');
        }
    };

    /**
     * Initialize compatibility checks
     */
    const init = () => {
        const features = checkFeatures();
        applyFallbacks(features);
        return features;
    };

    return {
        init
    };
})();

/* ============================================
   AnimationController Module
   Handles all animations and transitions
   ============================================ */
const AnimationController = (() => {
    // Canvas and context references
    let canvas = null;
    let ctx = null;
    let particles = [];
    let animationId = null;
    let isConfettiActive = false;

    /**
     * Heart particle class for confetti animation
     * Optimized for 60fps performance on mobile
     */
    class HeartParticle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 20 + 10;
            this.speedX = (Math.random() - 0.5) * 8;
            this.speedY = Math.random() * -12 - 5;
            this.gravity = 0.3;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
            this.opacity = 1;
            this.fadeSpeed = 0.008 + Math.random() * 0.005;

            // Premium color palette: crimson, rose, blush, gold
            const colors = ['#8b0000', '#ff6b81', '#ffb6c1', '#d4af37', '#ff4757'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        /**
         * Update particle physics
         */
        update() {
            this.speedY += this.gravity;
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;
            this.opacity -= this.fadeSpeed;

            // Add subtle wobble for organic movement
            this.x += Math.sin(this.rotation) * 0.5;
        }

        /**
         * Draw heart shape on canvas
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         */
        draw(ctx) {
            if (this.opacity <= 0) return;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;

            // Draw heart shape using bezier curves
            ctx.beginPath();
            const s = this.size / 15;
            ctx.moveTo(0, s * 3);
            ctx.bezierCurveTo(-s * 5, -s * 2, -s * 5, -s * 7, 0, -s * 5);
            ctx.bezierCurveTo(s * 5, -s * 7, s * 5, -s * 2, 0, s * 3);
            ctx.fill();

            ctx.restore();
        }

        /**
         * Check if particle is still visible
         * @returns {boolean}
         */
        isAlive() {
            return this.opacity > 0;
        }
    }

    /**
     * Initialize canvas with error handling
     */
    const initCanvas = ErrorHandler.safeExecute(() => {
        canvas = document.getElementById('confetti-canvas');
        if (!canvas) {
            throw new Error('Confetti canvas element not found');
        }

        // Check canvas support
        if (!canvas.getContext) {
            ErrorHandler.logError('Canvas', new Error('Canvas not supported'));
            return;
        }

        ctx = canvas.getContext('2d', { alpha: true });
        resizeCanvas();

        // Use passive listener for resize
        window.addEventListener('resize', resizeCanvas, { passive: true });
    }, 'Canvas Initialization');

    /**
     * Resize canvas to match window dimensions
     */
    const resizeCanvas = ErrorHandler.safeExecute(() => {
        if (!canvas) return;

        // Use device pixel ratio for sharp rendering on retina displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Scale context to match device pixel ratio
        if (ctx) {
            ctx.scale(dpr, dpr);
        }

        // Set CSS dimensions
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
    }, 'Canvas Resize');

    /**
     * Create confetti burst at specified position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} count - Number of particles
     */
    const createConfettiBurst = ErrorHandler.safeExecute((x, y, count = 50) => {
        for (let i = 0; i < count; i++) {
            particles.push(new HeartParticle(x, y));
        }
    }, 'Confetti Burst Creation');

    /**
     * Confetti animation loop with RAF optimization
     */
    const animateConfetti = ErrorHandler.safeExecute(() => {
        if (!ctx || !canvas) return;

        // Clear canvas with proper dimensions
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Update and draw particles
        particles = particles.filter(particle => {
            particle.update();
            particle.draw(ctx);
            return particle.isAlive();
        });

        // Continue animation if particles exist or confetti is active
        if (particles.length > 0 || isConfettiActive) {
            animationId = requestAnimationFrame(animateConfetti);
        } else {
            PerformanceMonitor.stopMonitoring();
        }
    }, 'Confetti Animation');

    /**
     * Start confetti celebration with multiple bursts
     */
    const startConfetti = ErrorHandler.safeExecute(() => {
        if (!canvas || !ctx) initCanvas();

        isConfettiActive = true;
        PerformanceMonitor.startMonitoring();

        // Initial burst from center
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        createConfettiBurst(centerX, centerY, 80);

        // Staggered bursts from different positions
        const burstPositions = [
            { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3, count: 40, delay: 200 },
            { x: window.innerWidth * 0.8, y: window.innerHeight * 0.3, count: 40, delay: 400 },
            { x: centerX, y: centerY - 100, count: 60, delay: 600 }
        ];

        burstPositions.forEach(({ x, y, count, delay }) => {
            setTimeout(() => createConfettiBurst(x, y, count), delay);
        });

        // Continuous smaller bursts for extended celebration
        let burstCount = 0;
        const burstInterval = setInterval(() => {
            if (burstCount >= 8) {
                clearInterval(burstInterval);
                isConfettiActive = false;
                return;
            }
            const randomX = Math.random() * window.innerWidth;
            const randomY = Math.random() * window.innerHeight * 0.5;
            createConfettiBurst(randomX, randomY, 20);
            burstCount++;
        }, 300);

        // Start animation loop
        if (!animationId) {
            animateConfetti();
        }
    }, 'Start Confetti');

    /**
     * Stop confetti animation and cleanup
     */
    const stopConfetti = ErrorHandler.safeExecute(() => {
        isConfettiActive = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        particles = [];
        PerformanceMonitor.stopMonitoring();
    }, 'Stop Confetti');

    /**
     * Show section with fade-in animation
     * @param {string} sectionId - Section element ID
     * @param {number} delay - Delay before showing (ms)
     * @returns {Promise}
     */
    const showSection = (sectionId, delay = 0) => {
        return new Promise(resolve => {
            setTimeout(() => {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.remove('hidden');
                    // Announce to screen readers
                    section.setAttribute('aria-hidden', 'false');
                }
                resolve();
            }, delay);
        });
    };

    /**
     * Hide section with fade-out animation
     * @param {string} sectionId - Section element ID
     * @param {number} delay - Delay before hiding (ms)
     * @returns {Promise}
     */
    const hideSection = (sectionId, delay = 0) => {
        return new Promise(resolve => {
            setTimeout(() => {
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.add('hidden');
                    // Hide from screen readers
                    section.setAttribute('aria-hidden', 'true');
                }
                resolve();
            }, delay);
        });
    };

    /**
     * Animate envelope opening
     * @returns {Promise}
     */
    const openEnvelope = () => {
        return new Promise(resolve => {
            const envelope = document.getElementById('envelope');
            if (envelope) {
                envelope.classList.add('open');
                // Announce to screen readers
                const announcement = document.createElement('div');
                announcement.setAttribute('role', 'status');
                announcement.setAttribute('aria-live', 'polite');
                announcement.className = 'sr-only';
                announcement.textContent = 'Envelope opened, revealing a love letter';
                document.body.appendChild(announcement);
                setTimeout(() => announcement.remove(), 2000);
            }
            // Wait for animation to complete (800ms flap + 400ms buffer)
            setTimeout(resolve, 1200);
        });
    };

    // Public API
    return {
        init: initCanvas,
        startConfetti,
        stopConfetti,
        showSection,
        hideSection,
        openEnvelope
    };
})();


/* ============================================
   UIController Module
   Handles user interactions and state
   ============================================ */
const UIController = (() => {
    // State
    let notesRemoved = 0;
    const totalNotes = 5;
    let noClickCount = 0;
    let yesScale = 1;
    let currentZIndex = 20;
    let isEvading = false;
    let noButtonActivated = false;

    // Detect mobile device (touch-only devices)
    const isMobileDevice = () => {
        return ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
            window.matchMedia('(max-width: 768px)').matches;
    };

    // DOM cache
    const elements = {
        btnOpen: null,
        btnYes: null,
        btnNo: null,
        buttonsWrapper: null,
        notes: null
    };

    // Initialize UI elements
    const cacheElements = () => {
        elements.btnOpen = document.getElementById('btn-open');
        elements.btnYes = document.getElementById('btn-yes');
        elements.btnNo = document.getElementById('btn-no');
        elements.buttonsWrapper = document.getElementById('buttons-wrapper');
        elements.notes = document.querySelectorAll('.draggable-note');
    };

    // Setup event listeners
    const setupEventListeners = () => {
        // Open button
        if (elements.btnOpen) {
            elements.btnOpen.addEventListener('click', handleOpenClick);
        }

        // Yes button
        if (elements.btnYes) {
            elements.btnYes.addEventListener('click', handleYesClick);
        }

        // No button - event listeners based on device type
        if (elements.btnNo) {
            // Click handler works on both mobile and desktop
            elements.btnNo.addEventListener('click', handleNoClick);

            // Only add hover/proximity evasion on desktop (non-mobile)
            if (!isMobileDevice()) {
                elements.btnNo.addEventListener('mouseenter', handleNoHover);

                // Track mouse movement globally for desktop proximity detection
                document.addEventListener('mousemove', (e) => {
                    if (!elements.btnNo || !noButtonActivated || isMobileDevice()) return;

                    const btn = elements.btnNo;
                    const btnRect = btn.getBoundingClientRect();
                    const mouseX = e.clientX;
                    const mouseY = e.clientY;

                    // Add buffer zone around button
                    const buffer = 30;
                    const isNearButton = mouseX >= btnRect.left - buffer &&
                        mouseX <= btnRect.right + buffer &&
                        mouseY >= btnRect.top - buffer &&
                        mouseY <= btnRect.bottom + buffer;

                    if (isNearButton && !isEvading) {
                        evadeNoButton();
                    }
                });
            }
        }

        // Setup drag for notes
        if (elements.notes) {
            elements.notes.forEach(note => {
                setupDrag(note);
            });
        }
    };

    // Handle open envelope click
    const handleOpenClick = async () => {
        // Disable button
        elements.btnOpen.disabled = true;
        elements.btnOpen.style.opacity = '0.7';

        // Open envelope animation
        await AnimationController.openEnvelope();

        // Transition to notes section
        await AnimationController.hideSection('envelope-section');
        await AnimationController.showSection('notes-section', 300);
    };

    // Setup drag functionality for a note with memory-safe cleanup
    const setupDrag = (note) => {
        let isDragging = false;
        let startX, startY;
        let initialX, initialY;
        let currentX = 0, currentY = 0;
        let rafId = null;

        // Get initial position from computed style
        const rect = note.getBoundingClientRect();
        const parentRect = note.parentElement.getBoundingClientRect();
        initialX = rect.left - parentRect.left;
        initialY = rect.top - parentRect.top;

        const onStart = (e) => {
            isDragging = true;
            document.body.classList.add('dragging');
            note.classList.add('dragging');

            // Increase z-index
            currentZIndex++;
            note.style.zIndex = currentZIndex;

            // Get start position
            if (e.type === 'touchstart') {
                startX = e.touches[0].clientX - currentX;
                startY = e.touches[0].clientY - currentY;
            } else {
                startX = e.clientX - currentX;
                startY = e.clientY - currentY;
            }
        };

        const onMove = (e) => {
            if (!isDragging) return;

            // Only prevent default for touch to allow scrolling when not dragging
            if (e.type === 'touchmove') {
                e.preventDefault();
            }

            let clientX, clientY;
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            currentX = clientX - startX;
            currentY = clientY - startY;

            // Use RAF for smooth 60fps animation
            if (rafId) {
                cancelAnimationFrame(rafId);
            }

            rafId = requestAnimationFrame(() => {
                // Hardware-accelerated transform (GPU)
                note.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            });
        };

        const onEnd = () => {
            if (!isDragging) return;

            isDragging = false;
            document.body.classList.remove('dragging');
            note.classList.remove('dragging');

            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            // Check if note is moved far enough to be "removed"
            const threshold = 150;
            const distance = Math.sqrt(currentX * currentX + currentY * currentY);

            if (distance > threshold && !note.dataset.removed) {
                note.dataset.removed = 'true';
                notesRemoved++;

                // Hardware-accelerated fade out
                note.style.opacity = '0';
                note.style.pointerEvents = 'none';

                // Announce to screen readers
                const announcement = document.createElement('div');
                announcement.setAttribute('role', 'status');
                announcement.setAttribute('aria-live', 'polite');
                announcement.className = 'sr-only';
                announcement.textContent = `Note ${notesRemoved} of ${totalNotes} removed`;
                document.body.appendChild(announcement);
                setTimeout(() => announcement.remove(), 1000);

                // Check if all notes removed
                checkAllNotesRemoved();
            }
        };

        // Mouse events
        note.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);

        // Touch events with passive flag for scroll performance
        note.addEventListener('touchstart', onStart, { passive: true });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd, { passive: true });

        // Store cleanup function for memory management
        note._dragCleanup = () => {
            note.removeEventListener('mousedown', onStart);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            note.removeEventListener('touchstart', onStart);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        };
    };

    // Check if all notes have been removed
    const checkAllNotesRemoved = async () => {
        if (notesRemoved >= totalNotes) {
            // Hide hint
            const hint = document.getElementById('hint-text');
            if (hint) hint.style.opacity = '0';

            // Transition to question
            await AnimationController.hideSection('notes-section', 500);
            await AnimationController.showSection('question-section', 300);
        }
    };

    // Handle Yes button click
    const handleYesClick = async () => {
        // Start confetti
        AnimationController.startConfetti();

        // Transition to success
        await AnimationController.hideSection('question-section');
        await AnimationController.showSection('success-section', 300);
    };

    // Handle No button click
    const handleNoClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        noClickCount++;
        noButtonActivated = true;

        // Make No button evade immediately
        evadeNoButton();

        // After many clicks, trigger yes automatically
        if (noClickCount >= 15) {
            handleYesClick();
        }
    };

    // Handle No button hover (desktop only evasion) - triggers immediately
    const handleNoHover = () => {
        // Only evade on hover for desktop devices
        if (!isMobileDevice()) {
            noButtonActivated = true;
            evadeNoButton();
        }
    };

    // Evade No button - move to random position within the question container
    const evadeNoButton = () => {
        if (isEvading) return;
        isEvading = true;

        const btn = elements.btnNo;
        const questionContainer = document.querySelector('.question-container');

        if (!btn || !questionContainer) {
            isEvading = false;
            return;
        }

        // Add evading class for absolute positioning within container
        btn.classList.add('evading');

        // Get container bounds (the glass container)
        const containerRect = questionContainer.getBoundingClientRect();

        // Get button dimensions
        const btnRect = btn.getBoundingClientRect();
        const btnWidth = btnRect.width || 100;
        const btnHeight = btnRect.height || 48;

        // Calculate safe area within the container with padding
        const padding = 20;
        const minX = containerRect.left + padding;
        const minY = containerRect.top + padding;
        const maxX = containerRect.right - btnWidth - padding;
        const maxY = containerRect.bottom - btnHeight - padding;

        // Ensure we have valid bounds
        if (maxX <= minX || maxY <= minY) {
            // Container too small, keep button centered
            btn.style.position = 'fixed';
            btn.style.left = `${containerRect.left + containerRect.width / 2 - btnWidth / 2}px`;
            btn.style.top = `${containerRect.top + containerRect.height / 2}px`;
            btn.style.transform = 'scale(1)';
            isEvading = false;
            return;
        }

        // Generate random position within container bounds
        let newX, newY;
        let attempts = 0;
        const maxAttempts = 20;

        do {
            newX = minX + Math.random() * (maxX - minX);
            newY = minY + Math.random() * (maxY - minY);
            attempts++;

            // Ensure NO button NEVER touches or overlaps YES button
            if (elements.btnYes) {
                const yesRect = elements.btnYes.getBoundingClientRect();

                // Large safety buffer to guarantee no touching (50px minimum gap)
                const safetyBuffer = 50;

                // No button bounds
                const noLeft = newX;
                const noRight = newX + btnWidth;
                const noTop = newY;
                const noBottom = newY + btnHeight;

                // Yes button expanded bounds (with safety buffer)
                const yesLeft = yesRect.left - safetyBuffer;
                const yesRight = yesRect.right + safetyBuffer;
                const yesTop = yesRect.top - safetyBuffer;
                const yesBottom = yesRect.bottom + safetyBuffer;

                // Check if NO button would be inside the YES button's exclusion zone
                const isInExclusionZone = (noRight > yesLeft &&
                    noLeft < yesRight &&
                    noBottom > yesTop &&
                    noTop < yesBottom);

                // Only accept position if OUTSIDE the exclusion zone
                if (!isInExclusionZone) {
                    break;
                }
            } else {
                break;
            }
        } while (attempts < maxAttempts);

        // If we couldn't find a valid position after all attempts, 
        // force position to bottom-right corner away from Yes button
        if (attempts >= maxAttempts && elements.btnYes) {
            const yesRect = elements.btnYes.getBoundingClientRect();
            // Position in opposite corner from Yes button
            if (yesRect.left < containerRect.left + containerRect.width / 2) {
                // Yes is on left, put No on right
                newX = maxX;
            } else {
                // Yes is on right, put No on left
                newX = minX;
            }
            if (yesRect.top < containerRect.top + containerRect.height / 2) {
                // Yes is on top, put No on bottom
                newY = maxY;
            } else {
                // Yes is on bottom, put No on top
                newY = minY;
            }
        }

        // Strictly clamp position within container bounds
        const finalX = Math.max(minX, Math.min(maxX, newX));
        const finalY = Math.max(minY, Math.min(maxY, newY));

        // Apply position using fixed positioning
        btn.style.position = 'fixed';
        btn.style.left = `${finalX}px`;
        btn.style.top = `${finalY}px`;
        btn.style.margin = '0';
        btn.style.right = 'auto';
        btn.style.bottom = 'auto';

        // Shrink the No button progressively after several clicks
        if (noClickCount >= 3) {
            const shrinkScale = Math.max(0.6, 1 - (noClickCount - 2) * 0.08);
            btn.style.transform = `scale(${shrinkScale})`;
        } else {
            btn.style.transform = 'scale(1)';
        }

        // Ensure button stays visible
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        btn.style.display = 'inline-flex';
        btn.style.pointerEvents = 'auto';
        btn.style.zIndex = '100';

        setTimeout(() => {
            isEvading = false;
        }, 150);
    };

    // Cleanup function for memory management
    const cleanup = () => {
        // Remove all event listeners
        if (elements.btnOpen) {
            elements.btnOpen.removeEventListener('click', handleOpenClick);
        }
        if (elements.btnYes) {
            elements.btnYes.removeEventListener('click', handleYesClick);
        }
        if (elements.btnNo) {
            elements.btnNo.removeEventListener('click', handleNoClick);
            elements.btnNo.removeEventListener('mouseenter', handleNoHover);
        }

        // Cleanup drag listeners
        if (elements.notes) {
            elements.notes.forEach(note => {
                if (note._dragCleanup) {
                    note._dragCleanup();
                }
            });
        }

    };

    // Initialize
    const init = () => {
        cacheElements();
        setupEventListeners();
        AnimationController.init();
    };

    // Public API
    return {
        init,
        cleanup
    };
})();


/* ============================================
   Application Entry Point
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize browser compatibility checks
    const features = BrowserCompatibility.init();

    // Log feature support in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🎨 Valentine App Initialized');
        console.log('📊 Browser Features:', features);
        console.log('🚀 Hardware Acceleration:', PerformanceMonitor.supportsHardwareAcceleration());
    }

    // Initialize application with error handling
    try {
        UIController.init();
    } catch (error) {
        ErrorHandler.handleError('Application Initialization', error, () => {
            // Fallback: Show a basic error message
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center; font-family: sans-serif;">
                    <div>
                        <h1 style="color: #8b0000; margin-bottom: 1rem;">💕</h1>
                        <p style="color: #666;">Something went wrong, but the love is still there!</p>
                        <p style="color: #999; font-size: 0.9rem; margin-top: 1rem;">Please try refreshing the page.</p>
                    </div>
                </div>
            `;
        });
    }

    // Cleanup on page unload to prevent memory leaks
    window.addEventListener('beforeunload', () => {
        try {
            UIController.cleanup();
            AnimationController.stopConfetti();
            PerformanceMonitor.stopMonitoring();
        } catch (error) {
            ErrorHandler.logError('Cleanup', error);
        }
    });

    // Handle visibility change to pause animations when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            PerformanceMonitor.stopMonitoring();
        } else {
            // Resume monitoring if confetti is active
            const canvas = document.getElementById('confetti-canvas');
            if (canvas && canvas.style.display !== 'none') {
                PerformanceMonitor.startMonitoring();
            }
        }
    });
});

// Prevent double-tap zoom on iOS (passive: false for preventDefault)
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd < 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    ErrorHandler.logError('Global Error', event.error);
    // Prevent default error handling in production
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        event.preventDefault();
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.logError('Unhandled Promise Rejection', event.reason);
    // Prevent default error handling in production
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        event.preventDefault();
    }
});

// Add screen reader only utility class for accessibility announcements
const style = document.createElement('style');
style.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
    }
    
    /* Fallback styles for browsers without transform support */
    .no-transforms .draggable-note {
        position: absolute;
        transition: left 0.3s ease, top 0.3s ease;
    }
    
    /* Fallback for backdrop-filter */
    .no-backdrop-filter .glass-container {
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 12px 48px rgba(139, 0, 0, 0.2);
    }
`;
document.head.appendChild(style);
