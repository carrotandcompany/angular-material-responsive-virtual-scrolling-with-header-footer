import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit, SimpleChanges
} from '@angular/core';
import { CdkScrollable, ScrollDispatcher } from '@angular/cdk/overlay';
import { delay, of } from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  selector: 'wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WrapperComponent implements OnInit {

  @Input() items!: any[];

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private cdkScrollable: CdkScrollable // injects the parent CdkVirtualScrollViewport
  ) {
  }


  ngOnInit(): void {
    // if we use ChangeDetectionStrategy.OnPush in the component where we are using the
    // *cdkVirtualFor then we need to manually trigger change detection
    // whenever the range of elements which are currently displayed in the scrolling viewport is
    // changing.
    if (this.cdkScrollable instanceof CdkVirtualScrollViewport) {
      this.cdkScrollable.renderedRangeStream.subscribe((range) => {
        this.changeDetectorRef.detectChanges();
      })
    }
  }
}
