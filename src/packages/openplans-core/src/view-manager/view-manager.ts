import { IViewOptions, View } from "./view";

export class ViewManager {
  private views: Map<string, View> = new Map();

  createView(options: IViewOptions): View {
    const view = new View(options);
    this.views.set(view.ogid, view);
    return view;
  }

  getView(ogid: string): View | undefined {
    return this.views.get(ogid);
  }
}