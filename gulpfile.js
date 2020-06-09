let projectFolder = require("path").basename(__dirname);
let sourceFolder = "#src";

let fs = require("fs");

let path = {
    build: {
        html: projectFolder + "/",
        js: projectFolder + "/js/",
        css: projectFolder + "/css/",
        img: projectFolder + "/img/",
        fonts: projectFolder + "/fonts/",
    },
    src: {
        html: [sourceFolder + "/*.html", "!" + sourceFolder + "/_*.html"],
        js: sourceFolder + "/js/script.js",
        css: sourceFolder + "/sass/style.sass",
        img: sourceFolder + "/img/**/*.{jpg, png, svg, gif, ico}",
        fonts: sourceFolder + "/fonts/**/*.ttf",
    },
    watch: {
        html: sourceFolder + "/**/*.html",
        js: sourceFolder + "/js/**/*.js",
        css: sourceFolder + "/sass/**/*.sass",
        img: sourceFolder + "/img/**/*.{jpg, png, svg, gif, ico}",
    },
    clean: "./" + projectFolder + "/"
}

let { src, dest } = require("gulp"),
    gulp = require("gulp"),
    browser_sync = require("browser-sync").create(),
    fileInclude = require("gulp-file-include"),
    del = require("del"),
    sass = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    cssMedia = require("gulp-group-css-media-queries"),
    cssClean = require("gulp-clean-css"),
    reName = require("gulp-rename"),
    uglify = require("gulp-uglify-es").default,
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    webpHtml = require("gulp-webp-html"),
    webpCss = require("gulp-webpcss"),
    ttf2woff = require("gulp-ttf2woff"),
    ttf2woff2 = require("gulp-ttf2woff2"),
    fonter = require("gulp-fonter");

function browserSync(params) {
    browser_sync.init({
        server: {
            baseDir: "./" + projectFolder + "/"
        },
        port: 3000,
        notify: false
    })
}

function js() {
    return src(path.src.js)
        .pipe(fileInclude())
        .pipe(dest(path.build.js))
        .pipe(
            uglify()
        )
        .pipe(
            reName({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browser_sync.stream())
}

function html() {
    return src(path.src.html)
        .pipe(fileInclude())
        .pipe(webpHtml())
        .pipe(dest(path.build.html))
        .pipe(browser_sync.stream())
}

function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browser_sync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(
            sass({
                outputStyle: "expanded"
            })
        )
        .pipe(
            cssMedia()
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(webpCss())
        .pipe(dest(path.build.css))
        .pipe(cssClean())
        .pipe(
            reName({
                extname: ".min.css"
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browser_sync.stream())
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task("eot2ttf", function () {
    return src([sourceFolder + "/fonts/*.eot"])
        .pipe(fonter({
            formats: ["ttf"]
        }))
        .pipe(dest(sourceFolder + "/fonts/"));
})

function fontsStyle(params) {

    let file_content = fs.readFileSync(sourceFolder + '/sass/fonts.sass');
    if (file_content == '') {
        fs.writeFile(sourceFolder + '/sass/fonts.sass', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(sourceFolder + '/sass/fonts.sass', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {

}

function watchFiles(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean(params) {
    return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.build = build;
exports.html = html;
exports.watch = watch;
exports.default = watch;

