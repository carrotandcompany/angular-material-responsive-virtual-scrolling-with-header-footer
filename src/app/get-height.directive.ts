// inspired by https://dev.to/christiankohler/how-to-use-resizeobserver-with-angular-9l5

import {
  Directive,
  ElementRef,
  EventEmitter,
  NgZone,
  Output,
} from '@angular/core';

declare var ResizeObserver:any;

@Directive({
  selector: '[calcHeight]',
})
export class GetHeightDirective {
  observer!:ResizeObserver;
  height: number = 0;

  @Output() heightChanged = new EventEmitter<number>();

  constructor(private host: ElementRef, private zone: NgZone) {}

  ngOnInit() {
    const observer = new ResizeObserver((entries:any) => {
      // Needed because zone hasn't patched ResizeObserver yet
      // if we don't use zone here, the EventEmitter doesn't trigger
      this.zone.run(() => {
        this.height = entries[0].contentRect.height;
        this.heightChanged.emit(this.height);
      });
    });

    observer.observe(this.host.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.unobserve(this.host.nativeElement);
    }
  }
}
