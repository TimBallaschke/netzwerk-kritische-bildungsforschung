<section class="aktuelles" aria-label="Aktuelles" x-data="{ view: 'grafik' }">
  <div class="aktuelles__switch" role="group" aria-label="Ansicht wechseln">
    <span class="aktuelles__switch-thumb" :class="`is-${view}`" aria-hidden="true"></span>
    <button type="button" class="aktuelles__switch-option" :class="{ 'is-active': view === 'grafik' }" :aria-pressed="view === 'grafik'" @click="view = 'grafik'">Grafik</button>
    <button type="button" class="aktuelles__switch-option" :class="{ 'is-active': view === 'liste' }" :aria-pressed="view === 'liste'" @click="view = 'liste'">Liste</button>
  </div>

  <div class="aktuelles__stage" x-show="view === 'grafik'">
    <svg class="aktuelles__connectors"></svg>
    <div class="aktuelles__ring">
      <div class="aktuelles__dot"></div>
      <div class="aktuelles__label">Aktuelles</div>
    </div>
  </div>

  <div class="aktuelles__list" x-show="view === 'liste'" x-cloak>
    <?php snippet('aktuelles-list') ?>
  </div>
</section>
