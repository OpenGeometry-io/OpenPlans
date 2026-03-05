import { defineConfig } from 'vite';
import { resolve } from 'path';
import { globSync } from 'glob';
import path from 'path';
import fs from 'fs';

// Dynamically find all HTML files in the examples folder
function getExampleInputs() {
  const inputs = {
    main: 'index.html',
  };

  // Find all HTML files in examples folder recursively
  const exampleFiles = globSync('examples/**/*.html');

  exampleFiles.forEach((file) => {
    // Create a unique key from the file path (e.g., 'primitives-line' from 'examples/primitives/line.html')
    const relativePath = path.relative('examples', file);
    const key = relativePath.replace(/\.html$/, '').replace(/[\/\\]/g, '-');
    inputs[key] = resolve(__dirname, file);
  });

  return inputs;
}

/**
 * Vite plugin to inject Mixpanel tracking during build only.
 * Replaces <!-- MIXPANEL_TRACKING --> comments in HTML with the
 * Mixpanel SDK + our custom tracking script from scripts/mixpanel-tracking.js.
 */
function mixpanelPlugin() {
  let isBuild = false;

  return {
    name: 'inject-mixpanel',
    config(_, { command }) {
      isBuild = command === 'build';
    },
    transformIndexHtml(html) {
      if (!isBuild) return html;
      if (!html.includes('<!-- MIXPANEL_TRACKING -->')) return html;

      // Read the tracking script
      const trackingScriptPath = resolve(__dirname, 'scripts/mixpanel-tracking.js');
      const trackingCode = fs.readFileSync(trackingScriptPath, 'utf-8');

      // Official Mixpanel loader snippet — creates a synchronous stub so
      // `mixpanel.init()` and `mixpanel.track()` work immediately while
      // the full library loads in the background.
      const mixpanelSnippet = `
    <!-- Mixpanel Tracking (injected during build) -->
    <script type="text/javascript">
(function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;b._i=[];b.init=function(e,f,c){function g(a,d){var b=d.split(".");2==b.length&&(a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b;"undefined"!==typeof c?a=b[c]=[]:c="mixpanel";a.people=a.people||[];a.toString=function(a){var d="mixpanel";"mixpanel"!==c&&(d+="."+c);a||(d+=" (stub)");return d};a.people.toString=function(){return a.toString(1)+".people (stub)"};i="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<i.length;h++)g(a,i[h]);var j="set set_once union unset remove delete".split(" ");a.get_group=function(){function b(c){d[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));a.push([e,call2])}}for(var d={},e=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<j.length;c++)b(j[c]);return d};b._i.push([e,f,c])};b.__SV=1.2;e=f.createElement("script");e.type="text/javascript";e.async=!0;e.src="file:"===f.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";g=f.getElementsByTagName("script")[0];g.parentNode.insertBefore(e,g)}})(document,window.mixpanel||[]);
    </script>
    <script>
${trackingCode}
    </script>`;

      return html.replace('<!-- MIXPANEL_TRACKING -->', mixpanelSnippet);
    }
  };
}

export default defineConfig({
  base: './',
  resolve: {
    dedupe: ['three'],
    alias: {
      '@src': resolve(__dirname, 'src'),
    },
  },
  plugins: [mixpanelPlugin()],
  build: {
    target: 'esnext',  // Enable top-level await support
    outDir: 'examples-dist',
    rollupOptions: {
      input: getExampleInputs(),
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js', // JS files inside assets/js
        chunkFileNames: 'assets/chunks/[name]-[hash].js', // Chunked JS files
        assetFileNames: 'assets/static/[name]-[hash][extname]', // Organize static files
      },
    },
  },
  server: {
    port: 5555
  }
});
