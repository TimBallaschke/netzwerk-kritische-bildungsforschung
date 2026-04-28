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
          dryRun: false,
          message: null,
          error: null,
          items: []
        };
      },
      methods: {
        async run() {
          this.loading = true;
          this.error = null;
          this.message = null;
          this.items = [];

          try {
            const res = await this.$api.post("aktuelles-scraper/run", {
              dryRun: this.dryRun
            });

            if (res.ok) {
              if (this.dryRun) {
                this.message =
                  "Probelauf: " + res.kept + " relevante Treffer von " +
                  res.candidates + " Kandidaten (nichts gespeichert).";
              } else {
                this.message =
                  res.created + " Entwürfe angelegt · " +
                  res.candidates + " Kandidaten geprüft · " +
                  res.kept + " relevant.";
              }
              this.items = res.items || [];
              if (!this.dryRun && res.created > 0) {
                this.$reload();
              }
            } else {
              this.error = res.error || "Unbekannter Fehler";
            }
          } catch (e) {
            this.error = (e && e.message) ? e.message : String(e);
          } finally {
            this.loading = false;
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
                :disabled="loading"
                @click="run">
                {{ loading ? "Suche läuft …" : "Neue Inhalte suchen" }}
              </k-button>

              <label class="k-aktuelles-scraper-checkbox">
                <input type="checkbox" v-model="dryRun" :disabled="loading" />
                <span>Probelauf (nichts speichern)</span>
              </label>
            </div>

            <div v-if="loading" class="k-aktuelles-scraper-hint">
              Das kann eine Weile dauern (Tavily-Suche + KI-Bewertung pro Treffer) …
            </div>

            <div v-if="message" class="k-aktuelles-scraper-message k-aktuelles-scraper-message--ok">
              {{ message }}
            </div>

            <div v-if="error" class="k-aktuelles-scraper-message k-aktuelles-scraper-message--error">
              Fehler: {{ error }}
            </div>

            <ul v-if="items.length" class="k-aktuelles-scraper-results">
              <li v-for="item in items" :key="item.url">
                <span class="k-aktuelles-scraper-results-rel">{{ item.relevance }}/5</span>
                <span class="k-aktuelles-scraper-results-type">{{ typeLabel(item.type) }}</span>
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
