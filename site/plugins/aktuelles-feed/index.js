panel.plugin("nkb/aktuelles-feed", {
  sections: {
    aktuellesfeed: {
      data() {
        return {
          headline: null,
          help: null,
          entries: [],
          saving: false
        };
      },
      created() {
        this.reload();
      },
      methods: {
        reload() {
          this.load().then((response) => {
            this.headline = response.headline;
            this.help = response.help;
            this.entries = response.entries.map((entry) => ({
              id: entry.id,
              title: entry.title,
              info: entry.date
                ? entry.category + " · " + entry.date
                : entry.category,
              link: entry.link
            }));
          });
        },
        save() {
          this.saving = true;
          this.$api
            .patch("aktuelles-feed/sort", {
              ids: this.entries.map((entry) => entry.id)
            })
            .then(() => {
              this.saving = false;
              if (this.$panel && this.$panel.notification) {
                this.$panel.notification.success("Reihenfolge gespeichert");
              }
            })
            .catch((error) => {
              this.saving = false;
              if (this.$panel && this.$panel.notification) {
                this.$panel.notification.error(error);
              }
            });
        }
      },
      template: `
        <section class="k-section">
          <header class="k-section-header">
            <k-headline>{{ headline }}</k-headline>
          </header>
          <k-text v-if="help" theme="help" class="k-help aktuelles-feed__help">{{ help }}</k-text>
          <k-draggable
            v-if="entries.length"
            v-model="entries"
            :options="{ handle: '.aktuelles-feed__handle' }"
            @end="save"
            class="aktuelles-feed"
          >
            <div
              v-for="entry in entries"
              :key="entry.id"
              class="aktuelles-feed__item"
            >
              <k-link :to="entry.link" class="aktuelles-feed__link">
                <span class="aktuelles-feed__title">{{ entry.title }}</span>
                <span class="aktuelles-feed__info">{{ entry.info }}</span>
              </k-link>
              <span class="aktuelles-feed__handle" title="Ziehen zum Sortieren">
                <k-icon type="sort" />
              </span>
            </div>
          </k-draggable>
          <k-empty v-else icon="page" text="Keine Einträge im Feed" />
        </section>
      `
    }
  }
});
