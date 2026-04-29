panel.plugin("art-of-x/aktuelles-scraper", {
  sections: {
    "aktuelles-scraper": {
      props: {
        headline: String,
        lastRun: String,
        lastResult: String
      },
      data() {
        return {
          loading: false,
          deleting: false,
          error: null,
          items: [],
          warnings: [],
          progress: null,
          pollHandle: null
        };
      },
      beforeDestroy() {
        this.stopPolling();
      },
      methods: {
        async run() {
          this.loading = true;
          this.error = null;
          this.items = [];
          this.warnings = [];
          this.progress = null;
          this.startPolling();

          try {
            const res = await this.$api.post("aktuelles-scraper/run", {});

            if (res.ok) {
              this.items = res.items || [];
              const errs = res.errors || {};
              const flat = [];
              for (const src of Object.keys(errs)) {
                for (const m of (errs[src] || [])) {
                  flat.push("[" + src + "] " + m);
                }
              }
              this.warnings = flat.slice(0, 5);
              if (res.created > 0) {
                this.$reload();
              }
            } else {
              this.error = res.error || "Unbekannter Fehler";
            }
          } catch (e) {
            const status = e && (e.code || e.status);
            const detail = e && (e.message || e.toString());
            const data = e && e.response && e.response.data;
            const dataMsg = data && (data.message || JSON.stringify(data));
            this.error = [status, detail, dataMsg].filter(Boolean).join(" · ");
          } finally {
            this.stopPolling();
            this.progress = null;
            this.loading = false;
          }
        },
        startPolling() {
          this.stopPolling();
          const tick = async () => {
            try {
              const p = await this.$api.get("aktuelles-scraper/status");
              if (p && p.running) {
                this.progress = p;
                if (Array.isArray(p.items) && p.items.length > 0) {
                  this.items = p.items;
                }
              }
            } catch (e) {
              // ignore — the run endpoint will surface real failures
            }
          };
          tick();
          this.pollHandle = setInterval(tick, 1200);
        },
        stopPolling() {
          if (this.pollHandle) {
            clearInterval(this.pollHandle);
            this.pollHandle = null;
          }
        },
        typeLabel(type) {
          const labels = {
            publication: "Publikation",
            cfp: "Call for Papers",
            podcast: "Podcast",
            event: "Veranstaltung",
            news: "Nachricht"
          };
          return labels[type] || type;
        },
        async removeAll() {
          if (!window.confirm("Wirklich alle Einträge (Entwürfe und veröffentlicht) löschen? Das lässt sich nicht rückgängig machen.")) {
            return;
          }
          this.deleting = true;
          this.error = null;
          try {
            const res = await this.$api.post("aktuelles-scraper/delete-all", {});
            if (res.ok) {
              this.items = [];
              this.$reload();
            } else {
              this.error = res.error || "Konnte nicht löschen";
            }
          } catch (e) {
            const status = e && (e.code || e.status);
            const detail = e && (e.message || e.toString());
            this.error = [status, detail].filter(Boolean).join(" · ");
          } finally {
            this.deleting = false;
          }
        }
      },
      template: `
        <section class="k-section k-aktuelles-scraper">
          <header class="k-section-header">
            <k-headline>{{ headline }}</k-headline>
          </header>

          <div class="k-aktuelles-scraper-body">
            <p v-if="lastRun" class="k-aktuelles-scraper-status">
              Letzter Lauf: <strong>{{ lastRun }}</strong>
              <span v-if="lastResult"> — {{ lastResult }}</span>
            </p>
            <p v-else class="k-aktuelles-scraper-status k-aktuelles-scraper-status--muted">
              Noch kein Lauf durchgeführt.
            </p>

            <div class="k-aktuelles-scraper-controls">
              <k-button
                icon="search"
                theme="positive"
                variant="filled"
                size="lg"
                :disabled="loading || deleting"
                @click="run">
                {{ loading ? "Suche läuft …" : "Neue Inhalte suchen" }}
              </k-button>

              <k-button
                icon="trash"
                theme="negative"
                variant="filled"
                size="lg"
                :disabled="loading || deleting"
                @click="removeAll">
                {{ deleting ? "Lösche …" : "Alle Einträge löschen" }}
              </k-button>
            </div>

            <div v-if="loading" class="k-aktuelles-scraper-progress">
              <div class="k-aktuelles-scraper-progress-message">
                <span class="k-aktuelles-scraper-spinner" aria-hidden="true"></span>
                <span v-if="progress && progress.message">
                  {{ progress.message }}
                  <span v-if="progress.current && progress.total" class="k-aktuelles-scraper-progress-count">
                    ({{ progress.current }}/{{ progress.total }})
                  </span>
                </span>
                <span v-else>Suche läuft …</span>
              </div>
              <div
                v-if="progress && progress.current && progress.total"
                class="k-aktuelles-scraper-progress-bar">
                <div
                  class="k-aktuelles-scraper-progress-bar-fill"
                  :style="{ width: Math.round((progress.current / progress.total) * 100) + '%' }">
                </div>
              </div>
            </div>

            <div v-if="error" class="k-aktuelles-scraper-message k-aktuelles-scraper-message--error">
              Fehler: {{ error }}
            </div>

            <ul v-if="warnings.length" class="k-aktuelles-scraper-warnings">
              <li v-for="(w, idx) in warnings" :key="idx">{{ w }}</li>
            </ul>

            <ul v-if="items.length" class="k-aktuelles-scraper-results">
              <li v-for="item in items" :key="item.url">
                <span class="k-aktuelles-scraper-results-rel">{{ item.relevance }}/5</span>
                <span class="k-aktuelles-scraper-results-type">{{ typeLabel(item.type) }}</span>
                <span class="k-aktuelles-scraper-results-origin" v-if="item.origin">{{ item.origin }}</span>
                <a :href="item.url" target="_blank" rel="noopener" class="k-aktuelles-scraper-results-title">
                  {{ item.title }}
                </a>
              </li>
            </ul>
          </div>
        </section>
      `
    }
  }
});
