var _ = window,
	raf = (function () {
		return _.requestAnimationFrame ||
			_.webkitRequestAnimationFrame ||
			_.mozRequestAnimationFrame ||
			function (c) {
				to(c, 1000 / 60);
			};
	})(),
	M = Math,
	abs = M.abs,
	min = M.min,
	max = M.max,
	to = setTimeout;

function rd(a, b) {
	if (!b) {
		b = a;
		a = 0;
	}
	return M.random() * (b - a) + a;
};

function rp(a) {
	return a[~~rd(a.length)];
}

function xt(o, x) {
	var r = {};

	// 复制
	for (var i in o) {
		r[i] = o[i];
	}

	// 覆盖
	for (var i in x) {
		r[i] = x[i];
	}

	return r;
}

// 快捷方式
var p = CanvasRenderingContext2D.prototype;
p.fr = p.fillRect;
p.sv = p.save;
p.rs = p.restore;
p.tr = p.translate;
p.lt = p.lineTo;
p.mt = p.moveTo;
p.sc = p.scale;
p.bp = p.beginPath;
p.clg = p.createLinearGradient;
p.rt = p.rotate;
p.ft = p.fillText;

p.alpha = function (x) {
	this.globalAlpha = x;
};

p.fs = function (p) {
	this.fillStyle = P.inverted ? invert(p) : p;
};

p.di = function (i, x, y) {
	if (P.inverted) arguments[0] = invert(arguments[0]);
	this.drawImage.apply(this, arguments);
};

// 将所有这些函数添加到全局作用域中
for (var i in p) {
	_[i] = (function (f) {
		return function () {
			c[f].apply(c, arguments);
		}
	})(i);
}

var colorCache = {};

function invert(c) {
	if (c.inverted) {
		// 这是一个图像
		return c.inverted;
	}

	if (c.length) {
		// 这是一种颜色
		if (!colorCache[c]) {
			if (c.charAt(0) === '#') {
				var v = c.substring(1);
				if (v.length == 3) v = v.charAt(0) + '0' + v.charAt(1) + '0' + v.charAt(2) + '0';
				v = parseInt(v, 16);

				colorCache[c] = '#' + ("000000" + (v ^ 0xffffff).toString(16)).slice(-6);
			}
		}
		return colorCache[c] || c;
	}

	// 无法翻转
	return c;
};

function cache(w, h, rr, t, i) {
	var c = document.createElement('canvas'),
		r = c.getContext('2d');
	c.width = c.w = w;
	c.height = c.h = h;

	rr(c, r, w, h);

	if (i) {
		P.inverted = true;
		c.inverted = cache(w, h, rr, 0, false);
		P.inverted = false;
	}

	if (t === 'pattern') {
		var p = r.createPattern(c, 'repeat');
		p.width = w;
		p.height = h;
		if (i) {
			p.inverted = r.createPattern(c.inverted, 'repeat');
			p.inverted.width = w;
			p.inverted.height = h;
		}
		return p;
	}

	return c;
};

function noop() { };

function limit(x, a, b) {
	return max(a, min(b, x));
};

function shuffle(o) {
	for (var j, x, i = o.length; i; j = ~~(rd(1) * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

// 振动接口
navigator.vibrate = (function () {
	return navigator.vibrate
		|| navigator.mozVibrate
		|| navigator.webkitVibrate
		|| noop;
})();

var P = {
	w: 640,
	h: 920,
	g: 800,
	waterOffset: 100
};

function Game() {
	G = this;

	G.highscore = parseInt(localStorage['hs']) || 0;

	G.resolution = 1;
	G.curPos = [];

	G.can = document.querySelector('canvas');
	with (G.can) {
		width = P.w;
		height = P.h;
	}

	G.ctx = window.c = G.can.getContext('2d');

	G.newWorld();
	G.choice();
	wld.scenario = new MenuScenario();

	// 调整大小
	G.resize();
	addEventListener('resize', G.resize, false);

	with (document.body) {
		addEventListener('touc' + 'hstart', G.touchStart.bind(G), false);
		addEventListener('touc' + 'hmove', G.touchMove.bind(G), false);
		addEventListener('touc' + 'hend', G.touchEnd.bind(G), false);
		addEventListener('mous' + 'edown', G.mouseDown.bind(G), false);
		addEventListener('mous' + 'emove', G.mouseMove.bind(G), false);
		addEventListener('mous' + 'eup', G.mouseUp.bind(G), false);
	}
	addEventListener('keydown', G.keyDown.bind(G), false);
	addEventListener('keyup', G.keyUp.bind(G), false);

	// 循环
	G.frameCount = 0;
	G.lastFrame = G.frameCountStart = Date.now();
	raf(function () {
		G.cycle();
		raf(arguments.callee);
	});

	var displayablePixels = _.innerWidth * _.innerHeight * _.devicePixelRatio,
		gamePixels = P.w * P.h,
		ratio = displayablePixels / gamePixels;

	if (ratio < .5) {
		G.setResolution(ratio * 2);
	}

	prepare('die', [
		[3, , 0.0246, , 0.2645, 0.29, , -0.568, , , , , , , , , , , 1, , , 0.0072, , 0.5]
	]);
	prepare('jump', [
		[0, , 0.1336, , 0.1006, 0.3814, , 0.2867, , , , , , 0.1429, , , , , 0.7082, , , , , 0.5]
	]);
	prepare('boxland', [
		[3, , 0.0635, 0.13, 0.22, 0.14, 0.05, , 0.02, , , , , , , 0.28, , 0.04, 0.49, 0.04, , , , 0.25],
		[3, , 0.1733, 0.96, 0.06, 0.2304, , -0.3608, , , , , , , , , , , 1, , , , , 0.25],
		[3, , 0.09, 0.7003, 0.23, 0.0844, , 0.227, , , , , , , , 0.7108, , , 1, , , , , 0.25]
	]);
	prepare('heroland', [
		[3, , 0.0118, 0.03, 0.1681, 0.565, , -0.2343, , , , 0.26, 0.6855, , , , , , 1, , , , , 0.2]
	]);
	prepare('button', [
		[0, 0.1696, 0.5004, 0.2598, 0.3914, 0.7047, , 0.0141, -0.0005, , , 0.6608, -0.8497, -0.1484, -0.0163, 0.5521, 0.2529, -0.5832, 0.6323, -0.595, 0.9155, 0.2821, -0.0615, 0.26]
	]);
	prepare('test', [
		[, 0.5, , 0.2098, , 0.1569, 0.3, 0.3677, , 0.2937, , , , , , , , , , , 0.2912, , , , , 0.4261, , , 0.1431, , , , 1]
	])
	prepare('gameover', [
		[2, 0.18, 0.24, , 0.54, 0.34, , , , 1, 0.31, , , , 0.8522, , , , 0.23, , , , , 0.49]
	]);
};

Game.prototype = {
	choice: function () {
		G.menu = new Choice();
	},
	home: function () {
		G.menu = new Home(G);
	},
	prepareWorld: function () {
		if (G.world.hero.dead) {
			G.newWorld();
		}
	},
	play: function (t) {
		G.menu = null;
		if (G.world.hero.dead) {
			G.newWorld();
		}
		G.world.scenario = new TutorialScenario();
	},
	lost: function () {
		var s = G.world.score;

		G.highscore = M.max(s, G.highscore);
		localStorage['hs'] = G.highscore;

		G.lastScore = s;

		to(function () {
			wld.scenario = null;
			G.menu = new End(s);
		}, 1500);
	},
	cycle: function () {
		sv();
		sc(G.resolution, G.resolution);

		var n = Date.now(),
			e = (n - G.lastFrame) / 1000;

		e = M.min(e, 1 / 30);
		G.lastFrame = n;

		G.frameCount++;
		if (G.frameCount === 100) {
			var totalTime = Date.now() - G.frameCountStart,
				fps = G.frameCount / (totalTime / 1000);
			if (fps < 30 && !navigator.userAgent.match(/Android/i)) {
				G.setResolution(G.resolution * .6);
			}
		}

		G.world.cycle(e);
		if (G.menu) {
			G.menu.cycle(e);
		}

		Easing.cycle(e);

		rs();
	},
	newWorld: function () {
		G.world = new World();
	},
	resize: function () {
		to(function () {
			var maxWidth = innerWidth,
				maxHeight = innerHeight,

				availableRatio = maxWidth / maxHeight,
				baseRatio = P.w / P.h,
				ratioDifference = abs(availableRatio - baseRatio),
				width,
				height,
				s = document.getElementById('canvascontainer').style;

			if (availableRatio <= baseRatio) {
				width = maxWidth;
				height = width / baseRatio;
			} else {
				height = maxHeight;
				width = height * baseRatio;
			}

			s.width = width + 'px';
			s.height = height + 'px';
		}, 100);
	},
	pos: function (e) {
		var rect = G.can.getBoundingClientRect(),
			pos = [];

		e = e.touches || [e];

		for (var i = 0; i < e.length; i++) {
			pos.push({
				x: (e[i].clientX - rect.left) / (rect.width / P.w),
				y: (e[i].clientY - rect.top) / (rect.height / P.h)
			})
		}

		return pos;
	},
	touchStart: function (e, m) {
		e.preventDefault();
		G.touch = G.touch || !m;
		var p = G.pos(e);
		G.curPos = p;

		scrollTo(0, 1);

		if (G.menu) return;

		G.world.touchStart();
	},
	touchMove: function (e) {
		e.preventDefault();
		if (G.curPos) {
			G.curPos = G.pos(e);

			if (G.menu) return;
			G.world.touchMove();
		}
	},
	touchEnd: function (e) {
		e.preventDefault();

		var p = G.curPos[0];
		G.curPos = G.pos(e);

		if (G.menu) {
			G.menu.click(p.x, p.y);
		} else {
			G.world.touchEnd();
		}
	},
	keyDown: function (e) {
		if (e.keyCode == 32 || e.keyCode == 40 || e.keyCode == 38) e.preventDefault();
		if (G.menu) return;
		G.world.keyDown(e.keyCode);
	},
	keyUp: function (e) {
		if (G.menu) return;
		G.world.keyUp(e.keyCode);
	},
	mouseDown: function (e) {
		if (!G.touch) {
			G.touchStart(e, true);
		}
	},
	mouseMove: function (e) {
		if (!G.touch) {
			G.touchMove(e);
		}
	},
	mouseUp: function (e) {
		if (!G.touch) {
			G.touchEnd(e);
		}
	},
	setResolution: function (r) {
		G.can.width = P.w * r;
		G.can.height = P.h * r;

		G.resolution = r;
	}
};

function World() {
	wld = this;

	this.score = 0;

	this.waterY = P.h - P.waterOffset;
	this.waterSpeed = 0;
	this.flooding = false;
	this.camY = -400;
	this.nextThunder = 0;

	this.boxes = [];
	this.particles = [];

	this.down = {};

	this.angle = 0;

	this.nextSort = 0;

	// 主平台
	with (this.pf = this.addBox(new Box(this, P.w - 200, 200))) {
		x = P.w / 2;
		y = P.h - this.pf.h / 2;
		fall = false;
		pushable = false;
	}

	// 英雄
	with (this.hero = this.addBox(new Hero(this))) {
		x = P.w / 2;
		y = 100;
		land(this.pf);
	}

	this.drops = [];
	for (var i = 0; i < 10; i++) {
		this.drops.push({
			x: rd(P.w),
			y: rd(P.h)
		});
	}

	this.t = 0;
};

World.prototype = {
	getHeightMap: function (divs) {
		var map = [],
			me = this;
		for (var i = 0; i < divs; i++) {
			map.push(null);
		}
		this.boxes.forEach(function (b) {
			var ind,
				leftX, leftInd,
				rightX, rightInd;
			if (b !== me.hero) {
				leftInd = ~~(b.leftX() * map.length / P.w);
				rightInd = ~~(b.rightX() * map.length / P.w);

				for (ind = leftInd; ind <= rightInd; ind++) {
					map[ind] = min(map[ind] || me.pf.topY(), b.topY());
				}
			}
		});
		return map;
	},
	highestBox: function (x, y) {
		var r = null;
		this.boxes.forEach(function (b) {
			if (b !== wld.hero && b.topY() > y && (!r || b.topY() < r.topY())) {
				if (abs(x - b.x) < b.w / 2) {
					r = b;
				}
			}
		});
		return r;
	},
	idealSpawnX: function (w) {
		// 找到最低的高度
		var divs = ~~(P.w / w),
			map = this.getHeightMap(divs),
			ind = 0;
		for (var i = 1; i < divs; i++) {
			if (map[i] !== null && map[i] > map[ind]) {
				ind = i;
			}
		}

		// 创建一个可能的索引数组（与最低高度的差异足够小的索引）
		var maxY = map[ind],
			diff,
			inds = [];
		for (var i = 0; i < divs; i++) {
			diff = abs(map[i] - maxY);
			if (diff < 150) {
				inds.push(i);
			}
		}

		ind = rp(inds);

		return limit(ind * P.w / divs + w / 2, this.pf.x - this.pf.w / 2, this.pf.x + this.pf.w / 2)
			+ rd(-P.w / divs, P.w / divs) / 2;
	},
	resetDrop: function (d) {
		d.y = rd(-400, -100);
	},
	spawnBox: function (x, y, d) {
		d = d || rp([{
			w: 60,
			h: 60
		}, {
			w: 90,
			h: 60
		}, {
			w: 90,
			h: 90
		}, {
			w: 40,
			h: 90
		}]);

		var b = new Box(this, d.w, d.h);
		b.x = x || this.idealSpawnX(d.w);
		b.y = y || this.camY - 100;
		this.boxes.push(b);

		return b;
	},
	addBox: function (b) {
		this.boxes.push(b);
		return b;
	},
	removeBox: function (b) {
		var i = this.boxes.indexOf(b);
		if (i >= 0) this.boxes.splice(i, 1);
		b.exists = false;
	},
	balance: function () {
		var l = 0,
			r = 0;
		this.boxes.forEach(function (b) {
			if (b !== wld.hero && b !== wld.pf && b.liesOn) {
				if (b.x < P.w / 2) l++;
				else r++;
			}
		});
		return r - l;
	},
	cycle: function (e) {
		this.t += e;

		if (!this.hero.dead)
			this.waterY -= e * this.waterSpeed * (this.flooding ? 5 : 1);

		if ((this.nextSort -= e) <= 0) {
			this.sortBoxes();
			this.nextSort = 2;
		}

		if ((this.nextThunder -= e) <= 0) {
			this.thunder();
			this.nextThunder = 15;
		}

		if (this.angle !== 0) {
			this.boxes.forEach(function (b) {
				if (b !== wld.hero && b !== wld.pf) {
					b.setVX(wld.angle / (Math.PI / 32) * 20);
				}
			});
		}

		if (this.scenario) {
			this.scenario.cycle(e);
		}

		// 相机操作
		var rightY = this.hero.y - P.h * .6;
		var diff = rightY - this.camY;
		if (!this.hero.dead && !G.menu) {
			var s = diff > 0 ? 100 : 50;

			var s = max(10, abs(diff) * .5);

			diff = limit(diff, -s * e, s * e);

			this.camY += diff;
			this.camY = min(this.camY, this.waterY + P.waterOffset - P.h);
		}

		// 背景
		fs('#000');
		fr(0, 0, P.w, P.h);
		if (!P.inverted) di(stars, 0, 0);

		// 分数
		if (!G.menu && this.score > 0) {
			var s = this.score.toString();
			var w = textWidth(s);
			alpha(.2);
			drawText(c, s, P.inverted ? 'black' : 'white', (P.w - w) / 2, 300);
			alpha(1);
		}

		sv();
		tr(0, -~~this.camY);

		if (this.shake) {
			tr(~~rd(-8, 8), ~~rd(-8, 8));
		}

		sv();
		tr(0, ~~max(this.waterY + P.waterOffset, this.camY + P.h) - waterHalo.height);
		fs(waterHalo);
		fr(0, 0, P.w, waterHalo.height);
		rs();

		this.water(this.t * 50, this.waterY - 20);

		// 让我们对它应用一些旋转
		sv();
		tr(P.w / 2, P.h / 2);
		rt(this.angle);
		tr(-P.w / 2, -P.h / 2);

		var bs = this.boxes.slice(0);
		for (var i in bs) {
			bs[i].cycle(e);
		}

		for (var i in this.particles) {
			this.particles[i].render();
		}
		rs();

		this.water(-this.t * 50, this.waterY);
		this.water(this.t * 50, this.waterY + 20);

		rs();

		// 下雨
		sv();

		// 让我们对它应用一些旋转
		tr(P.w / 2, P.h / 2);
		rt(-M.PI / 64);
		tr(-P.w / 2, -P.h / 2);

		fs('#fff');
		alpha(this.flooding ? 1 : .5);
		for (var i = 0; i < this.drops.length; i++) {
			this.drops[i].y += e * (this.flooding ? 2000 : 1000);
			if (this.drops[i].y > P.h) {
				this.drops[i].x = rd(P.w);
				this.drops[i].y = rd(-600, -100);
			}
			fr(this.drops[i].x, this.drops[i].y, 2, 40);
		}

		rs();

		// 控件
		if (G.touch && !G.menu && !this.hero.dead && this.hero.controllable) {
			alpha(this.hero.walkDir == -1 ? 1 : .5);
			di(larrow, 60, P.h - 100);

			alpha(this.hero.walkDir == 1 ? 1 : .5);
			di(rarrow, P.w - 60 - rarrow.width, P.h - 100);

			alpha(this.hero.vY < 0 ? 1 : .5);
			di(jump, (P.w - jump.width) / 2, P.h - 100);

			alpha(1);
		}
	},
	water: function (x, y) {
		y = ~~y;

		sv();
		tr(x, y);
		alpha(.5);

		// 波纹图案
		fs(water);
		fr(-x, 0, P.w, water.height);

		// 计算需要填充的剩余空间
		var sy = ~~(water.height + y - this.camY);

		// 填充底部
		fs('#d5d5d5');
		fr(-x, water.height, P.w, P.h - sy);

		rs();
	},
	touchStart: function (x, y) {
		wld.evalTouchMovement();
	},
	touchMove: noop,
	touchEnd: function () {
		wld.evalTouchMovement();
	},
	keyUp: function (k) {
		wld.down[k] = 0;
		wld.evalKeyboardMovement();
	},
	keyDown: function (k) {
		wld.down[k] = true;

		if (k == 38 || k == 87) {
			wld.hero.jump();
		}
		wld.evalKeyboardMovement();
	},
	evalKeyboardMovement: function () {
		var wd = 0;
		if (wld.down[37] || wld.down[65]) {
			wd = -1;
		}
		if (wld.down[39] || wld.down[68]) {
			wd = 1;
		}
		wld.hero.setWalkDir(wd);
	},
	evalTouchMovement: function (x) {
		if (!G.touch) return;
		var wd = 0;
		G.curPos.forEach(function (t) {
			if (t.x < P.w / 3) {
				wd = -1;
			} else if (t.x > P.w * 2 / 3) {
				wd = 1;
			} else {
				wld.hero.jump();
			}
		});
		wld.hero.setWalkDir(wd);
	},
	quake: function () {
		var shake = function () {
			wld.boxes.forEach(function (b) {
				if (b !== wld.pf && b !== wld.hero) {
					b.vX = rd(-100, 100);
				}
			});
		};

		wld.hero.say('寒冬已至');

		to(function () {
			wld.shake = true;
		}, 2000);
		for (var t = 2; t < 5; t += .2) {
			to(shake, t * 1000);
		}
		to(function () {
			wld.shake = false;
			wld.hero.say('呜呜失业');
		}, t * 1000);
	},
	flood: function () {
		wld.hero.say('等我站在前端之巅');
		to(function () {
			wld.flooding = true;
		}, 2000);
		to(function () {
			wld.flooding = false;
			wld.hero.say('秋招结束~');
		}, 8000);
	},
	boxStorm: function () {
		wld.hero.say('箱雨，启动！');

		var xs = [];
		for (var i = 0; i < 1; i++) {
			for (var x = 0; x < P.w; x += rd(100, 200)) {
				xs.push(x);
			}
		}

		shuffle(xs);

		for (var i = 0, t = 3; i < xs.length; i++, t += 1.2) {
			to((function (x) {
				return function () {
					wld.spawnBox(x);
				}
			})(xs[i]), t * 1000);
		}

		to(function () {
			wld.hero.say('秋招结束？');
		}, t * 1000 + 1000);
	},
	addParticle: function (p) {
		wld.particles.push(p);
	},
	removeParticle: function (p) {
		var ind = wld.particles.indexOf(p);
		if (ind >= 0) wld.particles.splice(ind, 1);
	},
	sortBoxes: function () {
		wld.cleanBoxes();
		wld.boxes.sort(function (a, b) {
			var da = abs(a.x - P.w / 2),
				db = abs(b.x - P.w / 2);
			if (a === wld.hero) return 1;
			if (b === wld.hero) return -1;
			return db - da;
		});
	},
	cleanBoxes: function () {
		var maxVisibleY = max(wld.camY + P.h, wld.waterY + P.waterOffset),
			i = wld.boxes.length;

		while (wld.boxes[--i]) {
			if (wld.boxes[i].topY() >= maxVisibleY) {

				// 让我们阻止放在这个上面的盒子
				wld.boxes[i].over.forEach(function (b) {
					if (b !== wld.hero) {
						b.liesOn = null;
						b.fall = false;
					}
				});

				wld.boxes.splice(i, 1);
			}
		}
	},
	thunder: function () {
		var i = P.inverted,
			s = 200,
			show = function () { P.inverted = !i; },
			hide = function () { P.inverted = i; };

		for (var t = 0; t < 400; t += s) {
			to(show, t);
			to(hide, t + s / 2);
		}
	},
	tilt: function () {
		wld.hero.say('投晚没hc');

		var b = wld.balance(),
			a = M.PI / 64;
		if (b < 0) a *= -1;

		Easing.tween(wld, 'angle', 0, a, 1, 1, linear, function () {
			Easing.tween(wld, 'angle', wld.angle, 0, 1, 2);
		});
	}
};

function Menu() {
	this.buttons = [];

	this.alpha = 0;
	Easing.tween(this, 'alpha', 0, 1, .5);
}

Menu.prototype = {
	cycle: function (e) {
		alpha(this.alpha);
		fs('rgba(0,0,0,.7)');
		fr(0, 0, P.w, P.h);

		for (var i in this.buttons) {
			this.buttons[i].render();
		}

		alpha(1);
	},
	click: function (x, y) {
		for (var i in this.buttons) {
			if (this.buttons[i].contains(x, y)) {
				this.buttons[i].click();
				return;
			}
		}
	},
	out: function (f) {
		Easing.tween(this, 'alpha', this.alpha, 0, .5, 0, linear, f);
	}
};

function Home(g) {
	Menu.call(this);

	var h = this, lb;
	this.buttons.push(lb = new Button(playButton, (P.w - playButton.width) / 2, 0, function () {
		G.prepareWorld();
		h.out(G.play.bind(G));
	}));
	if (localStorage.getItem('tut') == 1) {
		this.buttons.push(lb = new Button(tutorialButton, (P.w - tutorialButton.width) / 2, 0, function () {
			localStorage['tut'] = null;
			G.prepareWorld();
			h.out(G.play.bind(G));
		}));
	}
	this.buttons.push(new Button(colorsButton, (P.w - colorsButton.width) / 2, 0, function () {
		P.inverted = !P.inverted;
		localStorage['c'] = P.inverted ? '1' : '0';
	}));

	this.titleY = 200;
	Easing.tween(this, 'titleY', -100, this.titleY, .5, 0, easeOutBack);

	var d = .5,
		y = this.buttons.length == 3 ? 400 : 500;
	this.buttons.forEach(function (b) {
		b.y = y;
		Easing.tween(b, 'y', b.y + 600, b.y, 1, d, easeOutBack);
		d += .5;
		y += 150;
	});

	Easing.tween(this, 'bestY', P.h, 860, 1, d, easeOutBack);
}

Home.prototype = xt(Menu.prototype, {
	cycle: function (e) {
		Menu.prototype.cycle.call(this, e);

		alpha(this.alpha);
		di(title, (P.w - title.width) / 2, this.titleY);

		var hsString = G.highscore ? ('high' + 'score: ' + G.highscore) : '';
		drawText(c, hsString, 'white', (P.w - textWidth(hsString, .5)) / 2, this.bestY, .5, 1);

		alpha(1);
	}
});

function End(s) {
	Menu.call(this);

	this.score = s;

	var h = this;
	this.buttons.push(new Button(retryButton, (P.w - playButton.width) / 2, 500, function () {
		G.prepareWorld();
		h.out(G.play.bind(G));
	}));
	this.buttons.push(new Button(menuButton, (P.w - playButton.width) / 2, 660, function () {
		G.home();
	}));

	Easing.tween(this.buttons[0], 'y', this.buttons[0].y + 500, this.buttons[0].y, 1, 1, easeOutBack);
	Easing.tween(this.buttons[1], 'y', this.buttons[1].y + 500, this.buttons[1].y, 1, 1.5, easeOutBack);

	play('gameover');
}

End.prototype = xt(Menu.prototype, {
	cycle: function (e) {
		Menu.prototype.cycle.call(this, e);

		alpha(this.alpha);
		di(gameover, (P.w - gameover.width) / 2, 200);

		var s = this.score + '';
		drawText(c, s, 'white', (P.w - textWidth(s)) / 2, 300, 1, true);

		s = 'best: ' + G.highscore;
		drawText(c, s, 'white', (P.w - textWidth(s, .5)) / 2, 400, .5, true);

		alpha(1);
	}
});

function Box(world, w, h) {
	this.w = w;
	this.h = h;
	this.x = this.y = 0;
	this.vX = this.vY = 0;
	this.fall = true;
	this.bounces = true;
	this.pushable = true;
	this.over = [];
	this.exists = true;
	this.yOffset = 0;
	this.haloLength = 0;

	this.sx = this.sy = 1;

	this.warningScale = 0;
	Easing.tween(this, 'warningScale', 0, 1, .3, 0, easeOutBack);
}

Box.prototype = {
	topY: function () {
		return this.y - this.h / 2;
	},
	bottomY: function () {
		return this.y + this.h / 2;
	},
	leftX: function () {
		return this.x - this.w / 2;
	},
	rightX: function () {
		return this.x + this.w / 2;
	},
	cycle: function (e) {
		var prevY = this.bottomY(),
			b,
			me = this;

		// 下落
		if (this.fall) {

			if (!this.liesOn) {
				this.y += e * this.vY;
				this.vY += e * P.g;

				if (this.vY > 0 && !this.decoration) {
					if (this.y > P.h) {
						wld.removeBox(this);
					}

					var below = this.findHighestBoxBelow(prevY);
					if (below && this.inter(below) && this.landingCondition(below)) {
						this.land(below);
					}
				}
			} else {
				b = this.liesOn;
				if (abs(b.x - this.x) > (this.w + b.w) / 2
					|| abs(b.y - this.y) > (this.h + b.h) / 2 + 2
					|| !b.exists) {
					this.free();
				}
			}
		}

		// 侧面移动
		if (this.vX != 0) {
			var x = this.x;

			this.x += this.vX * e;

			if (this.vX > 0) {
				this.vX = max(0, this.vX - e * 300);
			} else if (this.vX < 0) {
				this.vX = min(0, this.vX + e * 300);
			}

			// 重置当前盒子的速度
			// 这是为了避免一个盒子推过另一个盒子
			wld.boxes.forEach(function (b) {
				if (b !== me && b.inter(me)) {
					// 能量转移
					b.setVX(me.vX * .6);

					// 重置自身
					me.x = x;
					me.vX = 0;
				}
			});
		}

		// 光晕长度
		var l = limit(this.vY / 1000, 0, 1) * boxHalo.height,
			diff = l - this.haloLength;
		this.haloLength += limit(diff, -500 * e, 500 * e);

		// 水花
		if (prevY < wld.waterY && this.bottomY() > wld.waterY && !this.liesOn) {
			for (var i = 0; i < 20; i++) {
				var p = new Particle(rd(10, 20), '#ddd');
				p.x = rd(this.leftX(), this.rightX());
				p.y = this.bottomY() + 50;
				wld.addParticle(p);

				var fromCenter = p.x - this.x;
				var dx = (p.x - this.x) * 2;

				Easing.tween(p, 'x', p.x, p.x + dx, .3);
				Easing.tween(p, 'y', p.y, p.y - rd(100, 200), .3);
				Easing.tween(p, 's', p.s, 0, .3, 0, linear, p.remove.bind(p));
			}
		}

		this.render();
	},
	landingCondition: function (b) {
		return true;
	},
	render: function () {
		sv();

		alpha(this.decoration ? .5 : 1);
		tr(this.x, this.y);
		sc(this.sx, this.sy);
		tr(-this.x, -this.y);

		// 3D
		var leftFromCenterX = (P.w / 2 - (this.leftX())) / (P.w / 2),
			rightFromCenterX = (P.w / 2 - (this.rightX())) / (P.w / 2),
			leftExtension = min(0, leftFromCenterX) * 20,
			rightExtension = max(0, rightFromCenterX) * 20;

		if (this.fall && this.haloLength > 20) {
			sv();
			tr(this.leftX(), this.y - this.haloLength);
			fs(boxHalo);
			fr(leftExtension, 0, this.w - leftExtension + rightExtension, abs(this.haloLength));
			rs();
		}

		fs('#ffffff');
		fr(this.x - this.w / 2, this.y - this.h / 2 + this.yOffset, this.w, this.h);

		// 声明
		if (this.y < wld.camY - this.h / 2 && !this.decoration) {
			sv();
			tr(this.x, wld.camY + 100)
			sc(this.warningScale, this.warningScale);
			di(boxArrow, -boxArrow.width / 2, -boxArrow.height);
			rs();
		}

		// 渲染侧面
		fs('#c0c0c0');
		fr(this.leftX(), this.topY() + this.yOffset, leftExtension, this.h);
		fr(this.rightX(), this.topY() + this.yOffset, rightExtension, this.h);

		rs();
	},
	addOver: function (b) {
		var ind = this.over.indexOf(b);
		if (ind === -1) this.over.push(b);
	},
	removeOver: function (b) {
		var ind = this.over.indexOf(b);
		if (ind >= 0) this.over.splice(ind, 1);
	},
	free: function () {
		if (this.liesOn) {
			this.liesOn.removeOver(this);
			this.liesOn = null;
			this.vY = 0;
		}
	},
	land: function (b) {
		var v = this.vY,
			f = function (t, b, c, d) {
				var prct = (t / d);
				var f = 1 - M.pow(abs(prct * 2 - 1), 3);
				return f * c + b;
			};

		this.y = b.topY() - this.h / 2;

		if (this.vY > 100 && this.bounces) {
			Easing.tween(this, 'yOffset', 0, -this.vY / 45, .4, 0, f);
		}

		this.vY = 0;

		this.free();
		this.liesOn = b;
		b.addOver(this);

		b.squeeze(this, v);

		for (var x = this.leftX() + rd(5, 15); x < this.rightX(); x += rd(10, 25)) {
			var p = new Particle(rd(10, 20), 'gray');
			p.x = x;
			p.y = this.bottomY();
			wld.addParticle(p);

			Easing.tween(p, 'y', p.y, p.y - rd(30, 80), .3, 0, linear, p.remove.bind(p));
			Easing.tween(p, 's', p.s, 0, .3)
		}

		play(this === wld.hero ? 'heroland' : 'boxland');

		// 摆动
		Easing.tween(this, 'sx', 1, 1.1, .2, 0, f);
		Easing.tween(this, 'sy', 1, .9, .2, 0, f);
	},
	squeeze: noop,
	isBelow: function (b) {
		// 如果当前盒子在b之下则返回真
		return this.bottomY() > b.bottomY()
			&& abs(b.x - this.x) < (this.w + b.w) / 2;
	},
	pushToSide: function (b, p) {
		var x = this.x,
			vX;

		// 将b放置到最接近其理论位置的地方
		if (b.x > this.x) {
			b.x = this.rightX() + b.w / 2;
			if (p && this.pushable) vX = -150;
		} else {
			b.x = this.leftX() - b.w / 2;
			if (p && this.pushable) vX = 150;
		}

		vX && this.setVX(vX);
	},
	setVX: function (vX) {
		this.vX = vX;

		// 推动放在当前盒子上的盒子
		for (var i in this.over) {
			this.over[i].setVX(vX * .7);
		}
	},
	findHighestBoxBelow: function (bottomYBefore) {
		var r,
			me = this,
			by = this.bottomY();
		wld.boxes.forEach(function (h) {
			if (h.isBelow(me) && (!r || h.topY() < r.topY())) {

				r = h;
			}
		});
		return r;
	},
	inter: function (b) {
		return abs(b.x - this.x) < (this.w + b.w) / 2
			&& abs(b.y - this.y) < (this.h + b.h) / 2;
	}
};

function Hero(world) {
	Box.call(this, world, 40, 80);
	this.dir = this.wd = 1;
	this.walkDir = this.walkT = this.vXFactor = this.pushingTimer = 0;
	this.walking = this.bounces = false;
	this.controllable = true;
};

Hero.prototype = xt(Box.prototype, {
	cycle: function (e) {
		this.prevBottomY = this.bottomY();
		this.prevTopY = this.topY();

		Box.prototype.cycle.call(this, e);

		if (!this.controllable) {
			this.walkDir = 0;
		}

		if (this.walkDir) {
			if (this.walkDir !== this.dir) {
				this.vXFactor = 0;
			} else {
				this.vXFactor = min(this.vXFactor + e * 4, 1);
			}
		} else {
			this.vXFactor = max(0, this.vXFactor - e * 4);
		}

		this.dir = this.walkDir || this.dir;
		this.x += this.dir * 300 * this.vXFactor * e;
		this.walkT += abs(this.vXFactor) * e;
		if (!this.liesOn) this.walkT += e;
		this.walking = this.walkDir !== 0;

		this.pushingTimer -= e;
		this.sayT -= e;

		var me = this;
		wld.boxes.forEach(function (b) {
			if (me !== b && me.inter(b) && !b.decoration) {
				if (me.prevTopY > b.bottomY()) {
					me.vY = 0;
					me.y = b.bottomY() + me.h / 2;
				} else {
					b.pushToSide(me, me.liesOn);
					if (me.liesOn) me.pushingTimer = .3;
				}
			}
		});

		if (this.y > wld.waterY) {
			this.say('举报了哥！！！');
			if (this.y > wld.waterY + 50) {
				this.die();
			}
		}
	},
	landingCondition: function (b) {
		return b.topY() >= this.prevBottomY
			&& b.topY() <= this.bottomY();
	},
	render: function () {
		// 光晕
		var h = heroHalo;
		di(h, this.x - h.width / 2, this.y - h.height / 2);

		sv();
		tr(this.leftX(), this.topY());

		if (this.sayT > 0) {
			fs('#fff');
			fr(this.w / 2, -10, 4, this.sayY + 30);

			c.textAlign = 'center';
			c.textBaseline = 'middle';
			c.font = '16pt Arial';

			fs('#000');
			ft(this.sayS, this.w / 2 + 1, this.sayY + 1);

			fs('#fff');
			ft(this.sayS, this.w / 2, this.sayY);
		}

		tr(this.w / 2, 0);
		sc(this.wd * this.sx, 1);
		tr(-this.w / 2, 0);

		// 主体
		fs('#fff');
		fr(0, 0, this.w, 60);

		// 腿
		var la = 5, // 振幅
			lp = .5, // 时间段
			sl = M.sin(this.walkT * M.PI * 2 / lp) * la + la, // 正弦长度
			lll = 20, // 左腿长度
			rll = 20; // 右腿长
		if (this.walking || !this.liesOn) {
			;
			lll = 20 - sl;
			rll = 20 - la * 2 + sl;
		}

		fr(5, 60, 5, lll);
		fr(30, 60, 5, rll);

		// 眼睛
		fs('#000');

		// 让我们闪烁
		// 原始公式： min(max(-x + 4.5, x - 4.5) / .5, 1)
		var p = 4, // 眨眼间隔
			bt = .3, // 眨眼时间
			mt = wld.t % p, // 模时间
			mi = p - bt / 2, // 眨眼中间
			s = min(1, max(-mt + mi, mt - mi) / (bt / 2)), // 眼睛的比例
			h = s * 5;

		fr(20, 15, 5, 5 * s);
		fr(31, 15, 5, 5 * s);

		// 手臂
		fs('#ccc');
		if (!this.liesOn) {
			fr(3, -5, 5, 30);
			fr(17, -5, 5, 5);
		} else if (this.pushingTimer <= 0) {
			fr(3, 25, 5, 23);
		} else {
			fr(16, 33, 34, 5);
			fr(40, 25, 15, 5);
		}

		rs();
	},
	jump: function () {
		if (this.liesOn && this.controllable) {
			this.free();
			this.liesOn = false;
			this.vY = -400;
			play('jump');
		}
	},
	squeeze: function () {
		this.die();
	},
	die: function () {
		wld.removeBox(this);
		this.dead = true;

		play('die');

		G.lost();

		for (var i = 0; i < 20; i++) {
			var p = new Particle(rd(2, 8), 'red');
			p.x = rd(this.leftX() - 10, this.rightX() + 10);
			p.y = rd(this.topY(), this.bottomY());
			wld.addParticle(p);

			var b = wld.highestBox(p.x, p.y),
				y = b ? b.topY() : P.h + 200;

			Easing.tween(p, 'y', p.y, y, rd(.9, 1.2), 0, easeOutBounce);
			Easing.tween(p, 's', p.s, 0, 1, 3, linear, p.remove.bind(p));
		}
		for (var i = 0; i < 20; i++) {
			var p = new Particle(rd(10, 20), 'red');
			p.x = rd(this.leftX() - 10, this.rightX() + 10);
			p.y = rd(this.topY(), this.bottomY());
			wld.addParticle(p);

			Easing.tween(p, 'y', p.y, p.y - rd(30, 80), .3, 0, linear, p.remove.bind(p));
			Easing.tween(p, 's', p.s, 0, .3);
		}

		wld.shake = true;
		to(function () {
			wld.shake = false;
		}, 500);
		navigator.vibrate(500);
	},
	say: function (s, d) {
		if (s != this.sayS)
			Easing.tween(this, 'sayY', 0, -80, .5, 0, easeOutBack);
		this.sayS = s;
		this.sayT = d || 3;
	},
	setWalkDir: function (d) {
		if (d !== this.walkDir && d) {
			Easing.tween(this, 'wd', this.wd, d, .1);
		}
		this.walkDir = d;
	}
});

var defs = {
	a: [
		[1, 1, 1],
		[1, , 1],
		[1, 1, 1],
		[1, , 1],
		[1, , 1]
	],
	b: [
		[1, 1, 1],
		[1, , 1],
		[1, 1,],
		[1, , 1],
		[1, 1, 1]
	],
	c: [
		[1, 1, 1],
		[1, ,],
		[1, ,],
		[1, ,],
		[1, 1, 1]
	],
	e: [
		[1, 1, 1],
		[1, ,],
		[1, 1,],
		[1, ,],
		[1, 1, 1]
	],
	g: [
		[1, 1, 1],
		[1, ,],
		[1, ,],
		[1, , 1],
		[1, 1, 1]
	],
	h: [
		[1, , 1],
		[1, , 1],
		[1, 1, 1],
		[1, , 1],
		[1, , 1]
	],
	i: [
		[1, 1, 1],
		[, 1,],
		[, 1,],
		[, 1,],
		[1, 1, 1]
	],
	k: [
		[1, , 1],
		[1, , 1],
		[1, 1,],
		[1, , 1],
		[1, , 1]
	],
	l: [
		[1, , 0],
		[1, ,],
		[1, ,],
		[1, ,],
		[1, 1, 1]
	],
	m: [
		[1, , 1],
		[1, 1, 1],
		[1, , 1],
		[1, , 1],
		[1, , 1]
	],
	n: [
		[1, 1, 1],
		[1, , 1],
		[1, , 1],
		[1, , 1],
		[1, , 1]
	],
	o: [
		[1, 1, 1],
		[1, , 1],
		[1, , 1],
		[1, , 1],
		[1, 1, 1]
	],
	p: [
		[1, 1, 1],
		[1, , 1],
		[1, 1, 1],
		[1, ,],
		[1, ,]
	],
	r: [
		[1, 1, 1],
		[1, , 1],
		[1, 1,],
		[1, , 1],
		[1, , 1]
	],
	s: [
		[1, 1, 1],
		[1, ,],
		[1, 1, 1],
		[, , 1],
		[1, 1, 1]
	],
	t: [
		[1, 1, 1],
		[, 1,],
		[, 1,],
		[, 1,],
		[, 1,]
	],
	u: [
		[1, , 1],
		[1, , 1],
		[1, , 1],
		[1, , 1],
		[1, 1, 1]
	],
	v: [
		[1, , 1],
		[1, , 1],
		[1, , 1],
		[1, , 1],
		[, 1,]
	],
	w: [
		[1, , 1, , 1],
		[1, , 1, , 1],
		[1, , 1, , 1],
		[1, , 1, , 1],
		[, 1, , 1,]
	],
	x: [
		[1, , 1],
		[1, , 1],
		[, 1,],
		[1, , 1],
		[1, , 1]
	],
	y: [
		[1, , 1],
		[1, , 1],
		[1, 1, 1],
		[, 1,],
		[, 1,]
	],
	'\'': [
		[1]
	],
	'.': [
		[0],
		[0],
		[0],
		[0],
		[1]
	],
	' ': [
		[, 0],
		[,],
		[,],
		[,],
		[,]
	],
	':': [
		[0],
		[1],
		[],
		[1],
		[]
	],
	'?': [
		[1, 1, 1],
		[, , 1],
		[, 1, 1],
		[, ,],
		[, 1,]
	],
	'!': [
		[, 1,],
		[, 1,],
		[, 1,],
		[, ,],
		[, 1,]
	],
	'1': [
		[1, 1, 0],
		[, 1,],
		[, 1,],
		[, 1,],
		[1, 1, 1]
	],
	'2': [
		[1, 1, 1],
		[, , 1],
		[1, 1, 1],
		[1, ,],
		[1, 1, 1]
	],
	'3': [
		[1, 1, 1],
		[, , 1],
		[, 1, 1],
		[, , 1],
		[1, 1, 1]
	],
	'4': [
		[1, , 0],
		[1, ,],
		[1, , 1],
		[1, 1, 1],
		[, , 1]
	],
	'5': [
		[1, 1, 1],
		[1, ,],
		[1, 1,],
		[, , 1],
		[1, 1,]
	],
	'6': [
		[1, 1, 1],
		[1, ,],
		[1, 1, 1],
		[1, , 1],
		[1, 1, 1]
	],
	'7': [
		[1, 1, 1],
		[, , 1],
		[, 1,],
		[, 1,],
		[, 1,]
	],
	'8': [
		[1, 1, 1],
		[1, , 1],
		[1, 1, 1],
		[1, , 1],
		[1, 1, 1]
	],
	'9': [
		[1, 1, 1],
		[1, , 1],
		[1, 1, 1],
		[, , 1],
		[1, 1, 1]
	],
	'0': [
		[1, 1, 1],
		[1, , 1],
		[1, , 1],
		[1, , 1],
		[1, 1, 1]
	]
};

var Font = {};

var createFont = function (color) {
	Font[color] = {};

	for (var i in defs) {
		var d = defs[i];
		Font[color][i] = cache(d[0].length * 10 + 10, d.length * 10, function (c, r) {
			r.fs(color);

			for (var i in d) {
				for (var j in d[i]) {
					if (d[i][j]) {
						r.fr(j * 10, i * 10, 10, 10);
					}
				}
			}
		});
	}
};

createFont('white');
createFont('black');

var drawText = function (r, t, c, x, y, s, b) {
	s = s || 1;

	// 阴影
	if (b) drawText(r, t, 'black', x + 5, y + 5, s, false);

	r.sv();
	r.tr(x, y);
	r.sc(s, s);

	x = 0;
	for (var i = 0; i < t.length; i++) {
		var ch = t.charAt(i),
			img = Font[c][ch];
		if (img) {
			r.di(img, x, 0);
			x += img.width;
		}
	}
	r.rs();
};

var textWidth = function (t, s) {
	var w = 0, i = t.length;
	while (i--) {
		var img = Font['white'][t.charAt(i)];
		w += img ? img.width : 0;
	}
	return w * (s || 1);
};

var stars = cache(P.w, P.h, function (c, r) {
	r.fs('#000');
	r.fr(0, 0, c.w, c.h);

	r.fs('white');
	for (var i = 0; i < 300; i++) {
		r.globalAlpha = rd(.5, 1);
		r.fr(rd(P.w), rd(P.h), 2, 2);
	}

	var g = r.clg(0, P.h - 300, 0, P.h - 800);
	g.addColorStop(0, 'rgba(0, 0, 0, 1)');
	g.addColorStop(1, 'rgba(0, 0, 0, 0)');

	r.fs(g);
	r.fr(0, 0, P.w, P.h);
}),

	water = cache(100, 20, function (c, r) {
		var s = 100,
			ss = c.w / s,
			a = c.h / 2,
			p = c.w;

		r.fs('#d5d5d5');
		r.beginPath();
		r.mt(0, a);
		for (var i = 0, x = 0; i <= s; i++, x += ss) {
			r.lt(x, M.sin(x * M.PI * 2 / p) * a + a);
		}
		r.lt(x, c.h);
		r.lt(0, c.h);
		r.fill();
	}, 'pattern', true),

	waterHalo = cache(100, 400, function (c, r) {
		var g = r.clg(0, 0, 0, c.h),
			v = !P.inverted ? '255,255,255' : '0,0,0';
		g.addColorStop(0, 'rgba(' + v + ', 0)');
		g.addColorStop(1, 'rgba(' + v + ', 1)');

		r.globalAlpha = .3;
		r.fs(g);
		r.fr(0, 0, c.w, c.h);
	}, 'pattern', true),

	title = cache(475, 115, function (c, r) {
		drawText(r, '又一封感谢信', 'white', 0, 0, 1, 1);
		drawText(r, '干不动了', 'white', 0, 60, 1, 1);
	}),

	button = function (t, st) {
		return cache(400, 120, function (c, r) {
			r.fs('#fff');
			r.fr(0, 0, 400, 100);

			r.fs('#757575');
			r.fr(0, 100, c.w, 20);

			drawText(r, t, 'black', (c.w - textWidth(t)) / 2, 25);
		});
	},

	playButton = button('oc'),
	tutorialButton = button('help'),
	retryButton = button('try'),
	colorsButton = button('mode'),
	menuButton = button('back'),

	choice = function (fg, bg, t) {
		return cache(P.w, P.h / 2, function (c, r) {
			r.fs(bg);
			r.fr(0, 0, c.w, c.h);

			drawText(r, t, fg, (c.w - textWidth(t)) / 2, c.h / 2 - 25);
		});
	},
	bwButton = choice('black', '#fff', 'black on white'),
	wbButton = choice('white', '#000', 'white on black'),

	gameover = cache(345, 55, function (c, r) {
		drawText(r, 'play', 'white', 0, 0, 1, 1);
	}),

	rarrow = cache(80, 80, function (c, r) {
		r.fs('#000');
		r.beginPath();
		r.mt(0, 0);
		r.lt(c.w, c.h / 2);
		r.lt(0, c.h);
		r.fill();
	}, 0, true),

	larrow = cache(80, 80, function (c, r) {
		r.tr(c.w, 0);
		r.sc(-1, 1);

		r.di(rarrow, 0, 0);
	}, 0, true),

	jump = cache(80, 80, function (c, r) {
		r.fs('#000');
		r.bp();
		r.arc(c.w / 2, c.h / 2, c.w / 2, 0, M.PI * 2, true);
		r.fill();
	}, 0, true),

	boxArrow = cache(80, 80, function (c, r) {
		with (r) {
			tr(0, c.h);
			sc(2, -2);
			fs('#fff');
			bp();
			mt(20, 40);
			lt(40, 20);
			lt(30, 20);
			lt(30, 0);
			lt(10, 0);
			lt(10, 20);
			lt(0, 20);
			fill();
		}
	}, 0, true),

	heroHalo = cache(150, 150, function (c, r) {
		var g = r.createRadialGradient(
			c.w / 2,
			c.h / 2,
			1,
			c.w / 2,
			c.h / 2,
			c.h / 2),
			v = !P.inverted ? '255,255,255' : '0,0,0';

		g.addColorStop(0, 'rgba(' + v + ',1)');
		g.addColorStop(1, 'rgba(' + v + ',0)');

		r.globalAlpha = .3;

		r.fs(g);
		r.fr(0, 0, c.w, c.h);
	}, 0, true),

	boxHalo = cache(20, 200, function (c, r) {
		var g = r.clg(0, 0, 0, c.h),
			v = !P.inverted ? '255,255,255' : '0,0,0';

		g.addColorStop(0, 'rgba(' + v + ', 0)');
		g.addColorStop(1, 'rgba(' + v + ', 1)');

		r.globalAlpha = .5;
		r.fs(g);
		r.fr(0, 0, c.w, c.h);
	}, 'pattern', true)

	;

addEventListener('load', function () {
	new Game();
});

var tweens = [];

function linear(t, b, c, d) {
	return (t / d) * c + b;
};

function easeOutBack(t, b, c, d, s) {
	if (s == undefined) s = 1.70158;
	return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
};

function easeOutBounce(t, b, c, d) {
	if ((t /= d) < (1 / 2.75)) {
		return c * (7.5625 * t * t) + b;
	} else if (t < (2 / 2.75)) {
		return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
	} else if (t < (2.5 / 2.75)) {
		return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
	} else {
		return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
	}
};

var Easing = {
	tween: function (o, p, a, b, d, l, f, e) {
		tweens.push({
			o: o, // 物体
			p: p, // 属性
			a: a, // from
			b: b, // to
			d: d, // 持续时间
			l: l || 0,
			f: f || linear, // 缓动函数
			e: e || noop, // 结束回调
			t: 0
		});
	},
	cycle: function (e) {
		var tw;
		for (var i = tweens.length - 1; i >= 0; i--) {
			tw = tweens[i];
			if (tw.l > 0) {
				tw.l -= e;
				tw.o[tw.p] = tw.a;
			} else {
				tw.t = min(tw.d, tw.t + e);
				tw.o[tw.p] = tw.f(tw.t, tw.a, tw.b - tw.a, tw.d);
				if (tw.t == tw.d) {
					tw.e();
					tweens.splice(i, 1);
				}
			}
		}
	}
};

function Button(img, x, y, f) {
	this.img = img;
	this.x = x;
	this.y = y;
	this.clickf = f;
	this.enabled = true;
};

Button.prototype = {
	render: function () {
		di(this.img, this.x, this.y);
	},
	contains: function (x, y) {
		return this.enabled
			&& x > this.x
			&& y > this.y
			&& x < this.x + this.img.width
			&& y < this.y + this.img.height;
	},
	click: function () {
		this.clickf();
		play('button');
	}
}

function PlayScenario(skip) {
	this.nextSpawn = 6;
	this.nextScoreIncrease = this.waterDelay = 10;
	this.nextEvent = 40;

	this.flooding = false;

	this.topWorldTimer = 40;

	wld.hero.controllable = true;

	this.gimmicks = [
		['我应该带上泳衣', '或者伞'],
		['怎么面试？浇我啊大佬'],
		['雨还在下！', '我的offer呢！'],
		['箱子说啥？'],
		['面试官预测过这个吗？'],
		['关注我们校校'],
		['这一点都不像俄罗斯方块'],
		['我在雨中emo'],
		['我应该学游泳的'],
		['0offer小丑:( '],
		['这画面'],
		['我需要头盔', '安全第一'],
		['你注意到我眨眼了吗？'],
		['喜欢这个游戏吗？', '发校校介绍一下！']
	];

	shuffle(this.gimmicks);

	this.schedule = {};

	var t = 0;
	if (!skip) {
		this.schedule[0] = '哈喽' + (G.lastScore !== undefined ? ' 再一次' : '') + '!';
		if (G.highscore > 0 && G.lastScore === undefined) {
			this.schedule[0] = '嘿，你给我回来';
		}
		t += 3;
	}

	var s = 0;
	if (!skip) {
		if ('lastScore' in G && G.highscore < 40) {
			this.schedule[3] = '我看到你上次vivo面试表现的不太好';
			this.schedule[6] = '这是面试官给小丑的一些建议';
			this.schedule[9] = '你小子！尽量避免掉落的箱子';
			this.schedule[12] = '用箱子建墙';
			this.schedule[15] = '爬上去避雨';
			this.schedule[18] = '让我们面面吧！';
			this.schedule[21] = '下着箱雨！';

			s = 30;

			this.nextSpawn = 24;
		} else {
			this.schedule[t] = '雨还在下，谁给我一个offer啊！';
			this.schedule[t + 7] = 'JavaScript也算Java';

			this.nextSpawn = 6;

			s = 15;
		}
	}
	this.nextScoreIncrease = this.waterDelay = this.nextSpawn + 7;

	for (var i = 0; i < this.gimmicks[i]; i++, s += 15) {
		for (var j = 0; j < this.gimmicks[i][j]; j++, s += 3) {
			this.schedule[s] = this.gimmicks[i][j];
		}
	}

	this.schedule[s + 10] = '你小子跳最高';
	this.schedule[s + 13] = '跪了，曾✌李✌又oc了';

	this.t = 0;
};

PlayScenario.prototype = {
	cycle: function (e) {
		if (!wld.hero.dead && !G.menu) {
			this.t += e;

			// 噱头
			var rt = ~~this.t;
			if (this.schedule[rt]) {
				wld.hero.say(this.schedule[rt]);
				this.schedule[rt] = null;
			}

			if ((this.nextSpawn -= e) <= 0) {
				var b = wld.spawnBox();
				this.nextSpawn = 3;

				if (abs(b.x - wld.hero.x) < (wld.hero.w + b.w) / 2) {
					wld.hero.say('当心！你这个憨憨', 2);
				}
			}

			if ((this.topWorldTimer -= e) <= 0 && wld.hero.liesOn) {
				var higher, b;
				for (var i = 0; i < wld.boxes.length; i++) {
					b = wld.boxes[i];
					if (b != wld.hero && b.topY() < wld.hero.bottomY() && b.liesOn) {
						higher = true;
						break;
					}
				}
				if (!higher) {
					wld.hero.say('我不愧是农专计机卷王曾李✌');
					this.topWorldTimer = 20;
				}
			}

			if ((this.nextScoreIncrease -= e) <= 0) {
				wld.score += 1;
				this.nextScoreIncrease = 1;

				if (wld.score === G.highscore + 1 && G.highscore) {
					wld.hero.say('新纪录！纳斯！');
				}
			}

			if (this.waterDelay > 0) {
				this.waterDelay -= e;
				if (this.waterDelay <= 0) {
					wld.hero.say('雨还在下，前端和UI没什么区别');
				}
				wld.waterSpeed = 0;
			} else {
				wld.waterSpeed = 2.5;
				if (this.t > 60) {
					wld.waterSpeed = 3.5;
				}
			}

			this.nextEvent -= e;
			if (this.nextEvent <= 0) {
				var t = rp(['quake', 'flood', 'boxStorm', 'tilt']);
				wld[t].call(wld);
				this.nextEvent = 40;
			}
		}
	}
};

function TutorialScenario() {
	var s = this,
		dims = { w: 60, h: 60 };

	this.states = {
		hello: {
			init: function () {
				wld.hero.say('哈喽！梁老师');
				wld.hero.controllable = false;
			},
			cycle: function () {
				if (wld.hero.sayT < 0) {
					s.startState('name');
				}
			}
		},
		name: {
			init: function () {
				wld.hero.say('你可以叫我笨比0offer小丑');
			},
			cycle: function () {
				if (wld.hero.sayT < 0) {
					s.startState('spawn');
				}
			}
		},
		spawn: {
			init: function () {
				wld.hero.say('今天下箱雨，早面早排序');
				s.bx = wld.spawnBox(wld.pf.x - wld.pf.w / 2 + dims.w / 2, -100, dims);
			},
			cycle: function () {
				if (s.bx.liesOn) {
					s.startState('push');
				}
			}
		},
		push: {
			init: function () {
				wld.hero.say('尝试把这个推开！');
				wld.hero.controllable = true;
			},
			cycle: function () {
				if (wld.boxes.length === 2) {
					s.startState('pushed');
				} else if (wld.hero.sayT < 0) {
					wld.hero.say('使用箭头' + (G.touch ? '按钮' : '键') + '移动');
				}
			}
		},
		pushed: {
			init: function () {
				wld.hero.say('干的漂亮！曾✌！');
				wld.hero.controllable = false;
			},
			cycle: function () {
				if (wld.hero.sayT < 0) {
					s.startState('stacking');
				}
			}
		},
		stacking: {
			init: function () {
				wld.hero.say('箱子可以堆叠起来');

				var b = wld.pf.x + wld.pf.w / 2 - 70;
				if (wld.hero.x > P.w / 2) {
					b = P.w - b;
				}

				s.boxes = [];

				var xs = [b, b - 70, b + 70, b - 35, b + 35, b];
				xs.forEach(function (x, i) {
					to(function () {
						s.boxes.push(wld.spawnBox(x, null, dims));
					}, i * 400);
				});
				to(function () {
					s.startState('stack');
				}, xs.length * 200 + 2000);
			},
			cycle: noop
		},
		stack: {
			init: function () {
				wld.hero.say('尝试跳跃在它们上面');
				wld.hero.controllable = true;

				for (var i = 0; i < s.boxes.length; i++) {
					s.boxes[i].pushable = false;
				}
			},
			cycle: function () {
				if (wld.hero.liesOn === s.boxes[s.boxes.length - 1]) {
					s.startState('jumped');
				} else if (wld.hero.sayT < 0) {
					wld.hero.say(G.touch ? '用圆形按钮跳跃' : '用上箭头跳跃');
				}
			}
		},
		jumped: {
			init: function () {
				wld.hero.say('干的漂亮！李✌');
				wld.hero.controllable = false;
			},
			cycle: function () {
				if (wld.hero.sayT < 0) {
					s.startState('explain');
				}
			}
		},
		explain: {
			init: function () {
				wld.hero.say('小心！不要掉进水里！');

				for (var i = 0; i < s.boxes.length; i++) {
					s.boxes[i].pushable = true;
				}
			},
			cycle: function () {
				if (wld.hero.sayT < 0) {
					s.startState('start');
				}
			}
		},
		start: {
			init: function () {
				wld.hero.say('现在一起玩吧！投早去不了');
				wld.hero.controllable = true;
			},
			cycle: function () {
				if (wld.hero.sayT < 0) {
					s.end(true);
				}
			}
		}
	};

	if (localStorage['tut'] == 1) {
		to(this.end, 1);
	} else {
		this.startState('hello');
	}
};

TutorialScenario.prototype = {
	cycle: function (e) {
		if (this.state) {
			this.state.cycle(e);
		}

		wld.hero.x = limit(wld.hero.x, wld.pf.x - wld.pf.w / 2, wld.pf.x + wld.pf.w / 2);
	},
	startState: function (s) {
		(this.state = this.states[s]).init();
	},
	end: function (s) {
		localStorage['tut'] = 1;
		wld.scenario = new PlayScenario(s);
	}
};

function MenuScenario() {
	this.nb = 0;
};

MenuScenario.prototype = {
	cycle: function (e) {
		this.nb -= e;
		if (this.nb <= 0) {
			var b = wld.spawnBox();
			b.decoration = true;
			this.nb = .5;
		}
	}
};

function Particle(s, c) {
	this.s = s;
	this.c = c;
};

Particle.prototype = {
	render: function (e) {
		fs(this.c);
		fr(this.x - this.s / 2, this.y - this.s / 2, this.s, this.s);
	},
	remove: function () {
		wld.removeParticle(this);
	}
};

function Choice() {
	Menu.call(this);

	var h = this;
	this.buttons.push(new Button(bwButton, 0, 0, function () {
		P.inverted = true;
		localStorage['c'] = '1';
		h.out(G.home.bind(G));
	}));
	this.buttons.push(new Button(wbButton, 0, P.h / 2, function () {
		P.inverted = false;
		localStorage['c'] = '0';
		h.out(G.home.bind(G));
	}));

	var c = localStorage['c'];
	if (c) {
		P.inverted = c === '1';
		setTimeout(function () {
			G.home();
		}, 0);
	}
};

Choice.prototype = xt(Menu.prototype, {
	out: function (f) {
		Easing.tween(this.buttons[0], 'y', 0, -P.h / 2, .2);
		Easing.tween(this.buttons[1], 'y', P.h / 2, P.h, .2, 0, linear, f);
	}
});

function J(){this.B=function(e){for(var f=0;24>f;f++)this[String.fromCharCode(97+f)]=e[f]||0;0.01>this.c&&(this.c=0.01);e=this.b+this.c+this.e;0.18>e&&(e=0.18/e,this.b*=e,this.c*=e,this.e*=e)}}
var W=new function(){this.A=new J;var e,f,d,g,l,z,K,L,M,A,m,N;this.reset=function(){var c=this.A;g=100/(c.f*c.f+0.001);l=100/(c.g*c.g+0.001);z=1-0.01*c.h*c.h*c.h;K=1E-6*-c.i*c.i*c.i;c.a||(m=0.5-c.n/2,N=5E-5*-c.o);L=0<c.l?1-0.9*c.l*c.l:1+10*c.l*c.l;M=0;A=1==c.m?0:2E4*(1-c.m)*(1-c.m)+32};this.D=function(){this.reset();var c=this.A;e=1E5*c.b*c.b;f=1E5*c.c*c.c;d=1E5*c.e*c.e+10;return e+f+d|0};this.C=function(c,O){var a=this.A,P=1!=a.s||a.v,r=0.1*a.v*a.v,Q=1+3E-4*a.w,n=0.1*a.s*a.s*a.s,X=1+1E-4*a.t,Y=1!=
a.s,Z=a.x*a.x,$=a.g,R=a.q||a.r,aa=0.2*a.r*a.r*a.r,D=a.q*a.q*(0>a.q?-1020:1020),S=a.p?(2E4*(1-a.p)*(1-a.p)|0)+32:0,ba=a.d,T=a.j/2,ca=0.01*a.k*a.k,E=a.a,F=e,da=1/e,ea=1/f,fa=1/d,a=5/(1+20*a.u*a.u)*(0.01+n);0.8<a&&(a=0.8);for(var a=1-a,G=!1,U=0,v=0,w=0,B=0,t=0,x,u=0,h,p=0,s,H=0,b,V=0,q,I=0,C=Array(1024),y=Array(32),k=C.length;k--;)C[k]=0;for(k=y.length;k--;)y[k]=2*Math.random()-1;for(k=0;k<O;k++){if(G)return k;S&&++V>=S&&(V=0,this.reset());A&&++M>=A&&(A=0,g*=L);z+=K;g*=z;g>l&&(g=l,0<$&&(G=!0));h=g;0<
T&&(I+=ca,h*=1+Math.sin(I)*T);h|=0;8>h&&(h=8);E||(m+=N,0>m?m=0:0.5<m&&(m=0.5));if(++v>F)switch(v=0,++U){case 1:F=f;break;case 2:F=d}switch(U){case 0:w=v*da;break;case 1:w=1+2*(1-v*ea)*ba;break;case 2:w=1-v*fa;break;case 3:w=0,G=!0}R&&(D+=aa,s=D|0,0>s?s=-s:1023<s&&(s=1023));P&&Q&&(r*=Q,1E-5>r?r=1E-5:0.1<r&&(r=0.1));q=0;for(var ga=8;ga--;){p++;if(p>=h&&(p%=h,3==E))for(x=y.length;x--;)y[x]=2*Math.random()-1;switch(E){case 0:b=p/h<m?0.5:-0.5;break;case 1:b=1-2*(p/h);break;case 2:b=p/h;b=0.5<b?6.28318531*
(b-1):6.28318531*b;b=0>b?1.27323954*b+0.405284735*b*b:1.27323954*b-0.405284735*b*b;b=0>b?0.225*(b*-b-b)+b:0.225*(b*b-b)+b;break;case 3:b=y[Math.abs(32*p/h|0)]}P&&(x=u,n*=X,0>n?n=0:0.1<n&&(n=0.1),Y?(t+=(b-u)*n,t*=a):(u=b,t=0),u+=t,B+=u-x,b=B*=1-r);R&&(C[H%1024]=b,b+=C[(H-s+1024)%1024],H++);q+=b}q=0.125*q*w*Z;c[k]=1<=q?32767:-1>=q?-32768:32767*q|0}return O}};
window.jsfxr=function(e){W.A.B(e);var f=W.D();e=new Uint8Array(4*((f+1)/2|0)+44);var f=2*W.C(new Uint16Array(e.buffer,44),f),d=new Uint32Array(e.buffer,0,44);d[0]=1179011410;d[1]=f+36;d[2]=1163280727;d[3]=544501094;d[4]=16;d[5]=65537;d[6]=44100;d[7]=88200;d[8]=1048578;d[9]=1635017060;d[10]=f;for(var f=f+44,d=0,g="data:audio/wav;base64,";d<f;d+=3)var l=e[d]<<16|e[d+1]<<8|e[d+2],g=g+("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[l>>18]+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[l>>
12&63]+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[l>>6&63]+"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[l&63]);d-=f;return g.slice(0,g.length-d)+"==".slice(0,d)};

var sounds = {},
	prepare = function (sid, settings) {
		sounds[sid] = [];

		settings.forEach(function (s) {
			var a = new Audio();
			a.src = jsfxr(s);

			sounds[sid].push(a);
		});
	},
	play = function (sid) {
		sounds[sid] && rp(sounds[sid]).play();
	};


