(function ($) {
    var _prefix = (function (temp) {
        var aPrefix = ["webkit", "Moz", "o", "ms"],
        props = "";
        for (var i in aPrefix) {
            props = aPrefix[i] + "Transition";
            if (temp.style[props] !== undefined) {
                return "-" + aPrefix[i].toLowerCase() + "-";
            }
        }
        return false;
    })(document.createElement(PageMove));

    var MeasureDis = function () {
        var distance = 0;
        return function (dis) {
            return distance += dis;
        }
    };

    //根据起点和终点返回方向 1：向上，2：向下，3：向左，4：向右,0：未滑动
    var GetSlideDirection = function (startX, startY, endX, endY) {
        var dy = startY - endY;
        var dx = endX - startX;
        var result = 0;

        //如果滑动距离太短
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
            return result;
        }

        var angle = GetSlideAngle(dx, dy);
        if (angle >= -45 && angle < 45) {
            result = 4;
        } else if (angle >= 45 && angle < 135) {
            result = 1;
        } else if (angle >= -135 && angle < -45) {
            result = 2;
        }
        else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
            result = 3;
        }
        return result;
    }

    //返回角度
    function GetSlideAngle(dx, dy) {
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }


    var PageMove = (function () {
        //这样易于保存变量
        function TT(element, options) {
            this.settings = $.extend(true, $.fn.PageMove.defaults, options || {});
            this.element = element;
            this.init();
        }

        TT.prototype = {
            init: function () {
                var me = this;
                me.selectors = this.settings.selectors;
                me.sections = me.element.find(me.selectors.sections);
                me.section = me.sections.find(me.selectors.section);
                me.container = $("#container");
                me.canvas = $('#myCanvas');

                me.pageCount = me.pageCount();
                me.pageWidth = me.pageWidth();
                me.pagesWidth = me.pagesWidth();

                me.playlist = { openlight: 'openlight.mp3', last: 'last.mp3', firstbroke: 'eggbroke.mp3', secondbroke: 'eggbroke.mp3' };//只有第一次有播放音效和其它行为
                if (_prefix) {
                    me.sections.css(_prefix + 'transition-duration', me.settings.duration);
                }
                me.index = (me.settings.index >= 0 && me.settings.index < me.pagesCount) ? me.settings.index : 0;
                me.fixed = me.settings.fixed || 1000;
                me._initLayout();
                me._initEvent();
            },
            pageCount: function () {
                return this.section.length;
            },
            pagesWidth: function () {
                return this.element.width() * this.section.length;
            },
            pageWidth: function () {
                return this.element.width();
            },
            movepoint: {
                startX: 0,
                startY: 0,
                middleX: 0,
                middleY: 0,
                endX: 0,
                endY: 0,
                startLeft: 0
            },
            touchCtrl: {
                first: true,
                touched: false
            },
            _initEvent: function () {
                var me = this;
                var measureX = new MeasureDis();
                var measureY = new MeasureDis();
                me.container.on('vmousedown mousedown touchstart', function (e) {
                    me.touchCtrl.touched = true;

                    me.movepoint.startLeft = $('.sections').position().left;
                    me.movepoint.startX = e.originalEvent.touches[0].pageX;
                    me.movepoint.startY = e.originalEvent.touches[0].pageY;
                    me.movepoint.middleX = me.movepoint.startX;
                    me.movepoint.middleY = me.movepoint.startY;
                    e.stopPropagation();
                    measureX = new MeasureDis();
                }).on('vmousemove mousemove touchmove', function (e) {
                    e.preventDefault();
                    me.touchCtrl.touched = true;

                    var width = me.pageWidth;
                    var chazhiX = me.movepoint.middleX - e.originalEvent.targetTouches[0].pageX;
                    var chazhiY = Math.abs(e.originalEvent.targetTouches[0].pageY - me.movepoint.middleY);
                    me.movepoint.middleX = e.originalEvent.targetTouches[0].pageX;
                    me.movepoint.middleY = e.originalEvent.targetTouches[0].pageY;
                    var leftlocation = measureX(chazhiX) - me.movepoint.startLeft;

                    if (_prefix) {
                        me.sections.css(_prefix + 'transition-duration', '0ms');
                    }
                    if (leftlocation < me.pagesWidth - me.pageWidth && me.fixed != me.index) {
                        if (_prefix) {
                            me.sections.css(_prefix + 'transform', 'translate3d(-' + leftlocation + 'px,0px,0px)');
                        }
                    }

                    if (me.fixed === me.index) {
                        var result = measureY(chazhiY);
                        var images = me.section.eq(me.fix).find('img');
                        console.log(result);
                        //添加是否3秒没有上下触摸的判断，根据result是否增加判断

                        if (result > 6000 && me.playlist['secondbroke']) {
                            $('#img8').show();
                            $('#img7').hide();
                            me._playMusic('eggbroke.mp3');
                            delete me.playlist.secondbroke;
                        } else if (result > 2000 && me.playlist['firstbroke']) {
                            $('#img7').show();
                            $('#img6').hide();
                            me._playMusic(me.playlist['firstbroke']);
                            delete me.playlist.firstbroke;
                        }
                        if (result > 8000 && me.playlist['last']) {
                            setTimeout(function () {
                                $('#img9').show();
                                $('#img8').hide();
                                $('.section .floatimg').css('display', 'none');
                            }, 1200);
                            me._playMusic(me.playlist['last']);
                            delete me.playlist.last;
                            setTimeout(function () {
                                me.fixed = 1000;
                            }, 2000);

                        }
                    }
                    e.stopPropagation();
                }).on('vmouseup mouseup touchend mouseout', function (e) {
                    e.preventDefault();
                    me.movepoint.endX = e.originalEvent.changedTouches[0].pageX;
                    me.movepoint.endY = e.originalEvent.changedTouches[0].pageY;
                    if (_prefix) {
                        me.sections.css(_prefix + 'transition-duration', me.settings.duration);
                    }

                    var direction = GetSlideDirection(me.movepoint.startX, me.movepoint.startY, me.movepoint.endX, me.movepoint.endY);
                    if (Math.abs(me.movepoint.startX - me.movepoint.endX) > 0.2 * me.pageWidth && me.fixed != me.index) {
                        switch (direction) {
                            case 0:
                                //alert("没滑动");
                                break;
                            case 1:
                                //alert("向上");
                                break;
                            case 2:
                                //alert("向下");
                                break;
                            case 3:
                                if (me.index < me.pageCount - 1)
                                    me.index++;
                                break;
                            case 4:
                                if (me.index > 0)
                                    me.index--;
                                break;
                            default:
                        }
                        me._scrollPage(me.index);
                    }
                    else {
                        me._scrollPage(me.index);
                    }

                    if (me.index === 3 && me.playlist['openlight']) {
                        setTimeout(function () {
                            me._playMusic(me.playlist['openlight']);
                            delete me.playlist.openlight;
                        }, parseInt(me.settings.duration));
                    }
                    if (me.index === me.fixed) {
                        me.sections.find('.animate').addClass('activeAnimate');
                        setTimeout(function () {
                            me.sections.find('.animate').css('display', 'none');
                            me.sections.find('.animate').css('animation-play-state', 'paused')
                            .css('-webkit-animation-play-state', 'paused');
                        }, 3000);
                    }

                    if (me.index === me.fixed && me.touchCtrl.first) {
                        me.touchCtrl.touched = false;
                        me.touchCtrl.first = false;
                        var testMove = function () {
                            if (me.touchCtrl.touched) {
                                me.touchCtrl.touched = false;
                                return;
                            }
                            else {
                                if (me.fixed !== 1000) {
                                    $('#warning').show();
                                    me.sections.find('.animate').css('display', 'block').css('animation-play-state', 'running')
.css('-webkit-animation-play-state', 'running');
                                    setTimeout(function () {
                                        $('#warning').hide();
                                        me.sections.find('.animate').css('display', 'none').css('animation-play-state', 'paused')
.css('-webkit-animation-play-state', 'paused');
                                    }, 1000);
                                }
                            }
                            me.touchCtrl.first = false;

                            if (me.fixed === 1000) {
                                clearInterval(warning);
                            }
                        };

                        var warning = setInterval(testMove, 3000);
                    }

                });
            },
            _initLayout: function () {
                var me = this;
                var width = (me.pageCount * 100) + '%';
                var cellWidth = me.pageWidth;
                me.sections.width(width);
                me.section.width(cellWidth);
            },
            _scrollPage: function (index) {
                var me = this;
                var width = index * me.pageWidth;
                if (_prefix) {
                    me.sections.css(_prefix + 'transform', 'translate3d(-' + width + 'px,0px,0px)');
                }

                if (index === me.section.length - 1) {
                    me.canvas.css('z-index', '-1');
                }
                else {
                    me.canvas.css('z-index', '1000');
                }

            },
            _playMusic: function (str) {
                //音乐播放
                var me = this;
                var musicctrl = $('#effectMusic');
                musicctrl.attr('src', 'music/' + str);
                musicctrl[0].play();
            }
        };
        return TT;
    })();


    //单例模式
    $.fn.PageMove = function (options) {
        return this.each(function () {
            var me = $(this);
            var instance = me.data('PageMove');
            if (!instance) {
                instance = new PageMove(me, options);
                me.data('PageMove', instance);
            }
            if ($.type(options) === "string")
                return instance[options]();
        });
    };


    $.fn.PageMove.defaults = {
        selectors: {
            sections: ".sections",
            section: ".section",
            page: ".page",
            active: ".active"
        },
        index: 0,//起始页面
        fixed: 5,
        easing: 'linear',// "ease", //动画曲线
        duration: '300ms',//动画延迟
        callback: {}
    };

    $(function () {
        $('[data-PageMove]').PageMove({
        });
    });

})(jQuery);