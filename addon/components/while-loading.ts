import Component from '@ember/component';
// @ts-ignore: Ignore import of compiled template
import layout from '../templates/components/while-loading';
import { inject as service } from '@ember-decorators/service';
import LoadingService from '../services/loading';

export default class WhileLoading extends Component{
  layout = layout;

  @service
  loading!: LoadingService;

};
