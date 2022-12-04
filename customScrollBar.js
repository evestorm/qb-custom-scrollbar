;(function() {
  window.qbScrollBar = null;
  const ScrollBar = function(options) {
    this.pos = options.pos || 'right'; // 滚动条位置 left | top | right | bottom
    this.bgColor = options.bgColor || '#e1e1e1'; // 滚动条背景色
    this.fgColor = options.fgColor || 'grey'; // 滚动块背景色
    this.zIndex = options.zIndex || 99999; // 滚动条层级
    this.width = options.width || 10; // 滚动条宽度（竖向滚动条生效: left | right）
    this.height = options.height || 10; // 滚动条高度（横向滚动条生效: top | bottom）
    this.mode = options.mode || 'absolute'; // 滚动条定位（absolute | fixed）
    this.containerEle = options.container; // 父元素（可以理解为定义的可视区域）
    this.contentEle = options.content; // 内部滚动元素（可视区域中的滚动元素）
    this.absContainerEle = options.absContainer || options.container; // 滚动条相对目标元素定位
    this.className = options.className || 'qb-scroll-bar'; // 滚动条类名
    this.left = options.left || 0; // 定位后设置的 left | top | right | bottom
    this.top = options.top || 0;
    this.right = options.right || 0;
    this.bottom = options.bottom || 0;
    this.isVertical = this.pos === 'right' || this.pos === 'left'; // 判断滚动条是横向还是竖向
    this.isMobile = isMobile(); // 判断是否为移动端
    this.hideOriScrollBar = options.hideOriScrollBar || true; // 是否隐藏默认滚动条

    if (!this.containerEle || !this.contentEle) {
      console.warn('父容器元素以及内部滚动元素为必传元素');
      return;
    }
    // 如果定位父元素没有设置过 position 需要设置为相对定位
    if (this.absContainerEle && getStyles(this.absContainerEle, 'position') === 'static') {
      this.absContainerEle.style.position = 'relative';
    }

    this.init()
  }
  /**
   * 初始化
   */
  ScrollBar.prototype.init = function() {
    // 销毁之前实例对象
    this.destroy();
    // 创建滚动条
    this.createScrollBarEle();
    // 设置滚动条样式、位置
    this.setScrollBar();
    // 事件绑定
    this.bindEvent();
    // 是否隐藏默认滚动条
    this.hideOriScrollBar && this.setHideOriScrollBar();
  }
  /**
   * 销毁 ScrollBar
   */
  ScrollBar.prototype.destroy = function() {
    const old = window.qbScrollBar;
    if (old) {
      removeEvent(window, 'resize', old.bindResizeFn);
      removeEvent(old.contentEle, 'scroll', old.bindContentScrollFn);
      removeEvent(old.handleEle, old.isMobile ? 'touchstart' : 'mousedown', old.bindMouseDownFn);
      old.scrollBarEle.remove();
      old.scrollBarEle = null;
      old.handleEle.remove();
      old.handleEle = null;
      window.qbScrollBar = null;
    }
  }
  /**
   * 创建 ScrollBar 
   */
  ScrollBar.prototype.createScrollBarEle = function() {
    const scrollBarEle = document.createElement('div');
    const handleEle = document.createElement('div');
    scrollBarEle.appendChild(handleEle);
    this.absContainerEle.appendChild(scrollBarEle);
    window.qbScrollBar = this;
    this.scrollBarEle = scrollBarEle;
    this.handleEle = handleEle;
  }
  /**
   * 设置 ScrollBar 位置、样式
   */
  ScrollBar.prototype.setScrollBar = function() {
    this.scrollBarEle.style.backgroundColor = this.bgColor;
    this.scrollBarEle.style.position = this.mode;
    this.scrollBarEle.style.zIndex = this.zIndex;
    this.scrollBarEle.className = this.className;

    // 滚动块 active、hover 状态下改变鼠标为小手图标 
    addNewStyle(`
      .${this.scrollBarEle.className} > div:active,
      .${this.scrollBarEle.className} > div:hover {
          cursor: pointer;
      }
    `)

    this.handleEle.style.backgroundColor = this.fgColor;
    this.handleEle.style.position = 'absolute';
    
    // 设置 handle 起始位置
    this.isVertical
      ? (this.handleEle.style.top = Math.round(this.scrollBarEle.clientHeight * this.contentEle.scrollTop / this.contentEle.scrollHeight) + 'px')
      : (this.handleEle.style.left = Math.round(this.scrollBarEle.clientWidth * this.contentEle.scrollLeft / this.contentEle.scrollWidth) + 'px')

    switch (this.pos) {
      case 'left':
        this.scrollBarEle.style.width = this.width + 'px';
        this.scrollBarEle.style.height = '100%';
        this.scrollBarEle.style.left = this.left + 'px';
        this.scrollBarEle.style.top = this.top + 'px';

        this.handleEle.style.width = this.width + 'px';
        break;
      case 'top':
        this.scrollBarEle.style.height = this.height + 'px';
        this.scrollBarEle.style.width = '100%';
        this.scrollBarEle.style.left = this.left + 'px';
        this.scrollBarEle.style.top = this.top + 'px';

        this.handleEle.style.height = this.height + 'px';
        break;
      case 'right':
        this.scrollBarEle.style.width = this.width + 'px';
        this.scrollBarEle.style.height = '100%';
        this.scrollBarEle.style.top = this.top + 'px';
        this.scrollBarEle.style.right = this.right + 'px';

        this.handleEle.style.width = this.width + 'px';
        break;
      case 'bottom':
        this.scrollBarEle.style.height = this.width + 'px';
        this.scrollBarEle.style.width = '100%';
        this.scrollBarEle.style.left = this.left + 'px';
        this.scrollBarEle.style.bottom = this.bottom + 'px';

        this.handleEle.style.height = this.height + 'px';
        break;
      default:
        break;
    }

    // 设置 滚动块 宽高
    // x / 滚动条长度 = 可视区域长度 / 滚动区域长度
    this.isVertical
      ? (this.handleEle.style.height = Math.round(this.scrollBarEle.clientHeight * this.containerEle.clientHeight / this.contentEle.scrollHeight) + 'px')
      : (this.handleEle.style.width = Math.round(this.scrollBarEle.clientWidth * this.containerEle.clientWidth / this.contentEle.scrollWidth) + 'px')

    const contentSH = this.isVertical ? this.contentEle.scrollHeight : this.contentEle.scrollWidth;
    const contentCH = this.isVertical ? this.containerEle.clientHeight :this.containerEle.clientWidth;

    // 是否隐藏自定义滚动条
    if (contentCH >= contentSH) {
      this.scrollBarEle.style.display = 'none';
    } else if (this.scrollBarEle.style.display === 'none') {
      this.scrollBarEle.style.display = 'block';
    }
  }
  /**
   * 设置隐藏默认滚动条
   */
  ScrollBar.prototype.setHideOriScrollBar = function() {
    addNewStyle(
      `
      .${this.contentEle.className.split(' ').join('.')} {
        -ms-overflow-style: none;
        scrollbar-width: none;
        overflow: -moz-scrollbars-none;
      }
      .${this.contentEle.className.split(' ').join('.')}::-webkit-scrollbar {
        display: none;
      }
      `
    )
  }

  /**
   * 绑定事件
   */
  ScrollBar.prototype.bindEvent = function() {
    this.bindResizeFn = this.setScrollBar.bind(this);
    this.bindContentScrollFn = this.contentScroll.bind(this);
    this.bindMouseDownFn = this.handleMouseDown.bind(this);
    addEvent(window, 'resize', this.bindResizeFn);
    addEvent(this.contentEle, 'scroll', this.bindContentScrollFn);
    addEvent(this.handleEle, this.isMobile ? 'touchstart' : 'mousedown', this.bindMouseDownFn);
  }

  /**
   * 监听内容区域滚动事件
   */
  ScrollBar.prototype.contentScroll = function(e) {
    // x / 滚动条长度 = 内容偏移距离 / 内容长度
    this.isVertical
      ? (this.handleEle.style.top = Math.round(this.scrollBarEle.clientHeight * this.contentEle.scrollTop / this.contentEle.scrollHeight) + 'px')
      : (this.handleEle.style.left = Math.round(this.scrollBarEle.clientWidth * this.contentEle.scrollLeft / this.contentEle.scrollWidth) + 'px')
  }

  /**
   * 鼠标按下事件
   */
  ScrollBar.prototype.handleMouseDown = function(e = window.event) {
    // 获取鼠标距离 handle 把手左/上边距离
    // 鼠标离文档左侧距离 - box离文档左侧距离 = 鼠标距box左边缘距离
    const gap = pagePos(e)[this.isVertical ? 'Y' : 'X'] - parseInt(getStyles(this.handleEle, this.isVertical ? 'top' : 'left'));

    const mouseMove = (e = window.event) => {
      // 每次再把x，y这段距离减去
      const newPos = pagePos(e)[this.isVertical ? 'Y' : 'X'] - gap;
      this.handleEle.style[this.isVertical ? 'top' : 'left'] = newPos + 'px';
      // 计算内容区域需要滚动的距离
      // x / 滚动区域长度 = gap / scrollBar长度
      this.isVertical
        ? (this.contentEle.scrollTop = Math.round(this.contentEle.scrollHeight * newPos / this.scrollBarEle.clientHeight))
        : (this.contentEle.scrollLeft = Math.round(this.contentEle.scrollWidth * newPos / this.scrollBarEle.clientWidth))

      // 限制区域
      const newHandleOffset = this.handleEle[this.isVertical ? 'offsetTop' : 'offsetLeft'];
      const newHandleH = this.handleEle[this.isVertical ? 'clientHeight' : 'clientWidth'];
      const newScrollBarH = this.scrollBarEle[this.isVertical ? 'clientHeight' : 'clientWidth'];
      // console.log(newHandleOffset, newHandleH, newScrollBarH);
      if (newHandleOffset < 0) {
        this.handleEle.style[this.isVertical ? 'top' : 'left'] = '0px';
        return;
      }
      if (newHandleOffset + newHandleH > newScrollBarH) {
        this.handleEle.style[this.isVertical ? 'top' : 'left'] = newScrollBarH - newHandleH + 'px';
        return;
      }
    }

    const mouseUp = function(e = window.event) {
      removeEvent(document, this.isMobile ? 'touchmove' : 'mousemove', mouseMove);
      removeEvent(document, this.isMobile ? 'touchend' : 'mouseup', mouseUp);
    }

    addEvent(document, this.isMobile ? 'touchmove' : 'mousemove', mouseMove);
    addEvent(document, this.isMobile ? 'touchend' : 'mouseup', mouseUp);

    cancelBubble(e);
    preventDefaultEvent(e);
  }

  /**
   * 判断是否为移动端（决定使用touch还是mouse） 
   */
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // 添加事件
  function addEvent(elem, type, fn) {
    if (elem.addEventListener) {
      elem.addEventListener(type, fn, false);
    } else if (elem.attachEvent) {
      elem.attachEvent('on' + type, function() {
        fn.call(elem);
      })
    } else {
      elem['on' + type] = fn;
    }
  }

  // 移除事件
  function removeEvent(elem, type, fn) {
    if (elem.addEventListener) {
      elem.removeEventListener(type, fn, false);
    } else if (elem.attachEvent) {
      elem.detachEvent('on' + type, fn);
    } else {
      elem['on' + type] = null;
    }
  }

  // 取消冒泡
  function cancelBubble(e) {
    var e = e || window.event;

    if (e.stopPropagation) {
      e.stopPropagation();
    } else {
      e.cancelBubble = true;
    }
  }

  // 阻止默认事件
  function preventDefaultEvent(e) {
    var e = e || window.event;
    if (e.preventDefaultEvent) {
      e.preventDefaultEvent();
    } else {
      e.returnValue = false;
    }
  }

  /**
   * 获取指定元素的特定样式属性 
   */
  function getStyles(elem, prop) {
    if (window.getComputedStyle) {
      if (prop) {
        return window.getComputedStyle(elem, null)[prop];
      } else {
        return window.getComputedStyle(elem, null);
      }
    } else {
      if (prop) {
        return window.currentStyle(elem, null)[prop];
      } else {
        return window.currentStyle(elem, null);
      }
    }
  }

  /**
   * 获取页面偏移
   */
  function getScrollOffset() {
    if (window.pageXOffset) {
      return {
        left: window.pageXOffset,
        top: window.pageYOffset
      }
    } else {
      return {
        left: document.body.scrollLeft + document.documentElement.scrollLeft,
        top: document.body.scrollTop + document.documentElement.scrollTop
      }
    }
  }

  /**
   * 获取鼠标相对文档偏移
   */
  function pagePos(e) {
    var sLeft = getScrollOffset().left,
        sTop = getScrollOffset().top,
        cLeft = document.documentElement.clientLeft || 0,
        cTop = document.documentElement.clientTop || 0;

    return {
      X: (isMobile() ? e.touches[0].clientX : e.clientX) + sLeft - cLeft,
      Y: (isMobile() ? e.touches[0].clientY : e.clientY) + sTop - cTop
    }
  }

  /**
   * 添加样式
   */
  function addNewStyle(newStyle) {
    let styleElement = document.getElementById('qb-scrollbar-style');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.id = 'qb-scrollbar-style';
      document.getElementsByTagName('head')[0].appendChild(styleElement);
    }
    styleElement.appendChild(document.createTextNode(newStyle));
  }
  window.QBScrollBar = ScrollBar;
})();