import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';

@Component({
  selector: 'debug',
  template: `
  
  <div class="debug-component">
      <form (submit)="scrollIndexChanged.emit(+scrollIndex.value)">
        <mat-form-field appearance="outline" class="scroll-to">
          <mat-label>Scroll to index</mat-label>
          <input
            type="number"
            matInput
            placeholder="eg. 10"
            value="20"
            #scrollIndex
          />
          <button
            matSuffix
            mat-icon-button
            color="primary"
            (click)="scrollIndexChanged.emit(+scrollIndex.value)"
          >
            <mat-icon>search</mat-icon>
          </button>
        </mat-form-field>
        </form>
        <form (submit)="numItemsChanged.emit(+numItems.value)">
        <mat-form-field appearance="outline" class="set-num-items">
          <mat-label>Number of items</mat-label>
          <input type="number" matInput value="100" #numItems />
          <button
            matSuffix
            mat-raised-button
            color="primary"
            (click)="numItemsChanged.emit(+numItems.value)"
          >
            Set
          </button>
        </mat-form-field>
      </form>
    </div>
  
  `,
  styles: [
    `
    .debug-component {
        display: flex ;
        flex-wrap: wrap;
        justify-content: space-between;
    }

    form {
      width:100%;
    }

    mat-form-field.mat-form-field {
      width:100% !important;
    }
    
  `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DebugComponent {
  @Output() scrollIndexChanged = new EventEmitter<number>();
  @Output() numItemsChanged = new EventEmitter<number>();
}
