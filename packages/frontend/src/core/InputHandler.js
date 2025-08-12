export class InputHandler {
    currentDirection = 'RIGHT';
    lastInputDirection = 'RIGHT';
    touchStartX = null;
    touchStartY = null;
    swipeThreshold = 24; // px
    init(canvas, controls) {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        if (canvas) {
            // Обработка тапа по canvas для мобильных устройств
            canvas.addEventListener('touchstart', this.handleTouchStart.bind(this, canvas), { passive: false });
            canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        }
        if (controls) {
            controls.up?.addEventListener('click', () => this.setDirection('UP'));
            controls.down?.addEventListener('click', () => this.setDirection('DOWN'));
            controls.left?.addEventListener('click', () => this.setDirection('LEFT'));
            controls.right?.addEventListener('click', () => this.setDirection('RIGHT'));
        }
    }
    handleKeyDown(event) {
        let newDirection = null;
        switch (event.key) {
            case 'ArrowUp':
                if (this.currentDirection !== 'DOWN')
                    newDirection = 'UP';
                break;
            case 'ArrowDown':
                if (this.currentDirection !== 'UP')
                    newDirection = 'DOWN';
                break;
            case 'ArrowLeft':
                if (this.currentDirection !== 'RIGHT')
                    newDirection = 'LEFT';
                break;
            case 'ArrowRight':
                if (this.currentDirection !== 'LEFT')
                    newDirection = 'RIGHT';
                break;
        }
        if (newDirection) {
            this.lastInputDirection = newDirection;
        }
    }
    handleTouchStart(canvas, event) {
        // Предотвращаем зум/скролл на тап
        event.preventDefault();
        if (event.touches.length === 0)
            return;
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        // Вычисляем смещение от центра, чтобы понять основное направление тапа
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        let newDirection = null;
        if (Math.abs(dx) > Math.abs(dy)) {
            // Горизонтальный приоритет
            if (dx < 0 && this.currentDirection !== 'RIGHT')
                newDirection = 'LEFT';
            if (dx > 0 && this.currentDirection !== 'LEFT')
                newDirection = 'RIGHT';
        }
        else {
            // Вертикальный приоритет
            if (dy < 0 && this.currentDirection !== 'DOWN')
                newDirection = 'UP';
            if (dy > 0 && this.currentDirection !== 'UP')
                newDirection = 'DOWN';
        }
        if (newDirection) {
            this.lastInputDirection = newDirection;
        }
    }
    handleTouchMove(event) {
        if (this.touchStartX === null || this.touchStartY === null)
            return;
        event.preventDefault();
        const touch = event.touches[0];
        const dx = touch.clientX - this.touchStartX;
        const dy = touch.clientY - this.touchStartY;
        if (Math.abs(dx) < this.swipeThreshold && Math.abs(dy) < this.swipeThreshold)
            return;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0)
                this.setDirection('LEFT');
            else
                this.setDirection('RIGHT');
        }
        else {
            if (dy < 0)
                this.setDirection('UP');
            else
                this.setDirection('DOWN');
        }
        // reset to avoid multiple triggers
        this.touchStartX = null;
        this.touchStartY = null;
    }
    handleTouchEnd() {
        this.touchStartX = null;
        this.touchStartY = null;
    }
    setDirection(dir) {
        // запрещаем разворот на 180°
        if ((dir === 'UP' && this.currentDirection === 'DOWN') ||
            (dir === 'DOWN' && this.currentDirection === 'UP') ||
            (dir === 'LEFT' && this.currentDirection === 'RIGHT') ||
            (dir === 'RIGHT' && this.currentDirection === 'LEFT')) {
            return;
        }
        this.lastInputDirection = dir;
    }
    getDirection() {
        this.currentDirection = this.lastInputDirection;
        return this.currentDirection;
    }
}
