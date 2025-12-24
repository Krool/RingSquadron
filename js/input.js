/**
 * Touch and Mouse Input Handler
 * Supports drag-to-move, tap detection, and swipe gestures
 * @module input
 */
export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.targetX = null;
        this.targetY = null;
        this.isDragging = false;
        this.justTapped = false;

        // Mouse hover tracking (separate from drag target)
        this.hoverX = null;
        this.hoverY = null;

        // Swipe gesture tracking
        this.swipeStartX = null;
        this.swipeStartY = null;
        this.swipeStartTime = null;
        this.lastSwipe = null; // 'left', 'right', 'up', 'down' or null
        this.swipeThreshold = 50; // Min pixels to count as swipe
        this.swipeMaxTime = 300; // Max ms for a swipe gesture

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        // Handle touch cancel (when dragging outside)
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

        // Mouse events (for desktop testing)
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        // Listen on window for mousemove/mouseup to track dragging outside canvas
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Track mouse hover on canvas (for menu button highlights)
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseHover(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());

        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    getCanvasPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const pos = this.getCanvasPosition(e.touches[0].clientX, e.touches[0].clientY);
            this.targetX = pos.x;
            this.targetY = pos.y;
            this.isDragging = true;
            this.justTapped = true;

            // Start tracking potential swipe
            this.swipeStartX = pos.x;
            this.swipeStartY = pos.y;
            this.swipeStartTime = performance.now();
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0 && this.isDragging) {
            const pos = this.getCanvasPosition(e.touches[0].clientX, e.touches[0].clientY);
            this.targetX = pos.x;
            this.targetY = pos.y;
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.isDragging = false;
        // Clear target when finger lifts - drag only, no tap-to-move for gameplay
        // Keep target for menu taps though (justTapped still works for that)

        // Check for swipe gesture
        this.detectSwipe(this.targetX, this.targetY);
    }

    handleMouseDown(e) {
        const pos = this.getCanvasPosition(e.clientX, e.clientY);
        this.targetX = pos.x;
        this.targetY = pos.y;
        this.isDragging = true;
        this.justTapped = true;

        // Start tracking potential swipe
        this.swipeStartX = pos.x;
        this.swipeStartY = pos.y;
        this.swipeStartTime = performance.now();
    }

    handleMouseMove(e) {
        // Only update target while dragging - no click-to-move
        if (this.isDragging) {
            const pos = this.getCanvasPosition(e.clientX, e.clientY);
            this.targetX = pos.x;
            this.targetY = pos.y;
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
        // Don't clear target - let it persist for smoother stopping

        // Check for swipe gesture
        const pos = this.getCanvasPosition(e.clientX, e.clientY);
        this.detectSwipe(pos.x, pos.y);
    }

    // Track mouse hover position (for menu button highlights)
    handleMouseHover(e) {
        const pos = this.getCanvasPosition(e.clientX, e.clientY);
        this.hoverX = pos.x;
        this.hoverY = pos.y;
    }

    // Clear hover when mouse leaves canvas
    handleMouseLeave() {
        this.hoverX = null;
        this.hoverY = null;
    }

    // Get current target position (where player should move toward)
    // Only returns position while dragging for gameplay
    getTarget() {
        if (this.targetX === null || this.targetY === null) {
            return null;
        }
        // For gameplay movement, only track while actively dragging
        // Return position always for menu/UI interactions
        return { x: this.targetX, y: this.targetY };
    }

    // Get hover position (for menu highlights - works without clicking)
    getHoverPosition() {
        if (this.hoverX === null || this.hoverY === null) {
            return null;
        }
        return { x: this.hoverX, y: this.hoverY };
    }

    // Check if currently dragging (for gameplay movement)
    isActive() {
        return this.isDragging;
    }

    // Check if touch/mouse is currently pressed (for button press animations)
    isPressed() {
        return this.isDragging;
    }

    // Check if player just tapped (for start/restart screens)
    checkTap() {
        if (this.justTapped) {
            this.justTapped = false;
            return true;
        }
        return false;
    }

    // Reset input state
    reset() {
        this.targetX = null;
        this.targetY = null;
        this.isDragging = false;
        this.justTapped = false;
        this.lastSwipe = null;
        this.swipeStartX = null;
        this.swipeStartY = null;
        this.swipeStartTime = null;
    }

    /**
     * Detect swipe gesture from start to end position
     * @param {number} endX - End X position
     * @param {number} endY - End Y position
     */
    detectSwipe(endX, endY) {
        if (this.swipeStartX === null || this.swipeStartTime === null) return;

        const elapsed = performance.now() - this.swipeStartTime;
        if (elapsed > this.swipeMaxTime) {
            // Too slow to be a swipe
            this.swipeStartX = null;
            this.swipeStartY = null;
            this.swipeStartTime = null;
            return;
        }

        const dx = endX - this.swipeStartX;
        const dy = endY - this.swipeStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        // Check if movement exceeds threshold
        if (absX < this.swipeThreshold && absY < this.swipeThreshold) {
            // Not enough movement for a swipe
            this.swipeStartX = null;
            this.swipeStartY = null;
            this.swipeStartTime = null;
            return;
        }

        // Determine swipe direction (horizontal takes precedence for weapon switching)
        if (absX > absY) {
            this.lastSwipe = dx > 0 ? 'right' : 'left';
        } else {
            this.lastSwipe = dy > 0 ? 'down' : 'up';
        }

        // Clear start position
        this.swipeStartX = null;
        this.swipeStartY = null;
        this.swipeStartTime = null;
    }

    /**
     * Check for and consume a swipe gesture
     * @returns {string|null} 'left', 'right', 'up', 'down', or null
     */
    checkSwipe() {
        const swipe = this.lastSwipe;
        this.lastSwipe = null;
        return swipe;
    }

    /**
     * Check for horizontal swipe (left/right) for weapon switching
     * @returns {number} -1 for left, 1 for right, 0 for no swipe
     */
    checkHorizontalSwipe() {
        const swipe = this.checkSwipe();
        if (swipe === 'left') return -1;
        if (swipe === 'right') return 1;
        return 0;
    }
}
